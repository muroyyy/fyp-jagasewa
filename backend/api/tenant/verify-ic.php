<?php
require_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/textract_helper.php';
require_once '../../config/s3_helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Validate uploaded files
    if (!isset($_FILES['ic_front']) || !isset($_FILES['ic_back'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Both IC front and back images are required'
        ]);
        exit;
    }

    $icFront = $_FILES['ic_front'];
    $icBack = $_FILES['ic_back'];

    // Validate file types
    $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!in_array($icFront['type'], $allowedTypes) || !in_array($icBack['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Only JPEG and PNG images are allowed'
        ]);
        exit;
    }

    // Validate file sizes (max 5MB each)
    $maxSize = 5 * 1024 * 1024;
    if ($icFront['size'] > $maxSize || $icBack['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Image size must not exceed 5MB'
        ]);
        exit;
    }

    // Generate unique filenames
    $timestamp = time();
    $frontFilename = 'ic-verification/' . uniqid() . '_' . $timestamp . '_front.jpg';
    $backFilename = 'ic-verification/' . uniqid() . '_' . $timestamp . '_back.jpg';

    // Upload to S3 bucket: jagasewa-ic-verification
    $bucket = 'jagasewa-ic-verification';
    $region = 'ap-southeast-1';

    // Read file contents
    $frontContent = file_get_contents($icFront['tmp_name']);
    $backContent = file_get_contents($icBack['tmp_name']);

    // Upload to S3 using custom function for ic-verification bucket
    $frontUrl = uploadICToS3($frontContent, $frontFilename, $icFront['type']);
    $backUrl = uploadICToS3($backContent, $backFilename, $icBack['type']);

    if (!$frontUrl || !$backUrl) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to upload images to S3'
        ]);
        exit;
    }

    // Extract text using AWS Textract
    $frontTextResult = extractICData($frontContent);
    $backTextResult = extractICData($backContent);

    if (!$frontTextResult['success'] || !$backTextResult['success']) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to extract text from IC images'
        ]);
        exit;
    }

    // Analyze and parse IC data
    $extractedData = analyzeICData(
        $frontTextResult['text_lines'],
        $backTextResult['text_lines']
    );

    // Delete IC images from S3 immediately after extraction (privacy protection)
    deleteICFromS3($frontFilename);
    deleteICFromS3($backFilename);
    
    error_log("IC images deleted from S3 for privacy protection");

    // Return results (without S3 URLs since images are deleted)
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'IC verification completed. Images deleted for privacy.',
        'extracted_data' => $extractedData
    ]);

} catch (Exception $e) {
    error_log("IC Verification Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'IC verification failed: ' . $e->getMessage()
    ]);
}

// Helper function to upload to ic-verification bucket
function uploadICToS3($fileContent, $s3Key, $contentType) {
    $bucket = 'jagasewa-ic-verification';
    $region = 'ap-southeast-1';
    
    $credentials = getEC2Credentials();
    if (!$credentials) {
        error_log("Failed to get EC2 credentials");
        return false;
    }
    
    $url = "https://{$bucket}.s3.{$region}.amazonaws.com/{$s3Key}";
    $timestamp = gmdate('Ymd\THis\Z');
    $date = gmdate('Ymd');
    
    $payloadHash = hash('sha256', $fileContent);
    $headers = [
        'Host' => "{$bucket}.s3.{$region}.amazonaws.com",
        'Content-Type' => $contentType,
        'X-Amz-Date' => $timestamp,
        'X-Amz-Content-Sha256' => $payloadHash,
        'X-Amz-Security-Token' => $credentials['token']
    ];
    
    $signature = createS3SignatureForIC($credentials, $region, $bucket, $s3Key, $headers, $fileContent, $timestamp, $date);
    $headers['Authorization'] = $signature;
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_CUSTOMREQUEST => 'PUT',
        CURLOPT_POSTFIELDS => $fileContent,
        CURLOPT_HTTPHEADER => array_map(function($k, $v) { return "$k: $v"; }, array_keys($headers), $headers),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => false
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return "https://{$bucket}.s3.{$region}.amazonaws.com/{$s3Key}";
    }
    
    error_log("S3 upload failed with HTTP code: $httpCode, response: $response");
    return false;
}

function createS3SignatureForIC($credentials, $region, $bucket, $s3Key, $headers, $payload, $timestamp, $date) {
    $service = 's3';
    $algorithm = 'AWS4-HMAC-SHA256';
    
    $canonicalHeaders = '';
    $signedHeaders = '';
    ksort($headers);
    foreach ($headers as $name => $value) {
        $canonicalHeaders .= strtolower($name) . ':' . trim($value) . "\n";
        $signedHeaders .= strtolower($name) . ';';
    }
    $signedHeaders = rtrim($signedHeaders, ';');
    
    $canonicalRequest = "PUT\n/{$s3Key}\n\n{$canonicalHeaders}\n{$signedHeaders}\n" . hash('sha256', $payload);
    
    $credentialScope = "{$date}/{$region}/{$service}/aws4_request";
    $stringToSign = "{$algorithm}\n{$timestamp}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);
    
    $signingKey = hash_hmac('sha256', 'aws4_request', 
                  hash_hmac('sha256', $service,
                  hash_hmac('sha256', $region,
                  hash_hmac('sha256', $date, 'AWS4' . $credentials['secret_key'], true), true), true), true);
    
    $signature = hash_hmac('sha256', $stringToSign, $signingKey);
    
    return "{$algorithm} Credential={$credentials['access_key']}/{$credentialScope}, SignedHeaders={$signedHeaders}, Signature={$signature}";
}

function deleteICFromS3($s3Key) {
    $bucket = 'jagasewa-ic-verification';
    $region = 'ap-southeast-1';
    
    $credentials = getEC2Credentials();
    if (!$credentials) {
        error_log("Failed to get credentials for IC deletion");
        return false;
    }
    
    $url = "https://{$bucket}.s3.{$region}.amazonaws.com/{$s3Key}";
    $timestamp = gmdate('Ymd\THis\Z');
    $date = gmdate('Ymd');
    
    $headers = [
        'Host' => "{$bucket}.s3.{$region}.amazonaws.com",
        'X-Amz-Date' => $timestamp,
        'X-Amz-Security-Token' => $credentials['token']
    ];
    
    $signature = createS3DeleteSignatureForIC($credentials, $region, $bucket, $s3Key, $headers, $timestamp, $date);
    $headers['Authorization'] = $signature;
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_CUSTOMREQUEST => 'DELETE',
        CURLOPT_HTTPHEADER => array_map(function($k, $v) { return "$k: $v"; }, array_keys($headers), $headers),
        CURLOPT_RETURNTRANSFER => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $httpCode === 204;
}

function createS3DeleteSignatureForIC($credentials, $region, $bucket, $s3Key, $headers, $timestamp, $date) {
    $service = 's3';
    $algorithm = 'AWS4-HMAC-SHA256';
    
    $canonicalHeaders = '';
    $signedHeaders = '';
    ksort($headers);
    foreach ($headers as $name => $value) {
        $canonicalHeaders .= strtolower($name) . ':' . trim($value) . "\n";
        $signedHeaders .= strtolower($name) . ';';
    }
    $signedHeaders = rtrim($signedHeaders, ';');
    
    $canonicalRequest = "DELETE\n/{$s3Key}\n\n{$canonicalHeaders}\n{$signedHeaders}\n" . hash('sha256', '');
    
    $credentialScope = "{$date}/{$region}/{$service}/aws4_request";
    $stringToSign = "{$algorithm}\n{$timestamp}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);
    
    $signingKey = hash_hmac('sha256', 'aws4_request', 
                  hash_hmac('sha256', $service,
                  hash_hmac('sha256', $region,
                  hash_hmac('sha256', $date, 'AWS4' . $credentials['secret_key'], true), true), true), true);
    
    $signature = hash_hmac('sha256', $stringToSign, $signingKey);
    
    return "{$algorithm} Credential={$credentials['access_key']}/{$credentialScope}, SignedHeaders={$signedHeaders}, Signature={$signature}";
}
?>
