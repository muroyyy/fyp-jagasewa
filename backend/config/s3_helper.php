<?php
/**
 * S3 Helper Functions for File Upload
 */

function uploadToS3($filePath, $s3Key, $contentType = 'application/octet-stream') {
    $bucket = 'jagasewa-assets-dev';
    $region = 'us-east-1';
    
    error_log("S3 upload started for bucket: $bucket, region: $region");
    error_log("S3 key: $s3Key");
    
    // Create AWS credentials from EC2 instance role
    $credentials = getEC2Credentials();
    if (!$credentials) {
        error_log("Failed to get EC2 credentials");
        return false;
    }
    
    error_log("EC2 credentials obtained successfully");
    
    // Prepare file data
    $fileContent = file_get_contents($filePath);
    
    // Create S3 PUT request
    $url = "https://{$bucket}.s3.{$region}.amazonaws.com/{$s3Key}";
    $timestamp = gmdate('Ymd\THis\Z');
    $date = gmdate('Ymd');
    
    // Create signature
    $payloadHash = hash('sha256', $fileContent);
    $headers = [
        'Host' => "{$bucket}.s3.{$region}.amazonaws.com",
        'Content-Type' => $contentType,
        'X-Amz-Date' => $timestamp,
        'X-Amz-Content-Sha256' => $payloadHash,
        'X-Amz-Security-Token' => $credentials['token']
    ];
    
    $signature = createS3Signature($credentials, $region, $bucket, $s3Key, $headers, $fileContent, $timestamp, $date);
    $headers['Authorization'] = $signature;
    
    // Upload to S3
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
        $s3Url = "https://{$bucket}.s3.{$region}.amazonaws.com/{$s3Key}";
        error_log("S3 upload successful, URL: $s3Url");
        return $s3Url;
    }
    
    error_log("S3 upload failed with HTTP code: $httpCode, response: $response");
    return false;
}

function getEC2Credentials() {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 5
    ]);
    
    $roleName = curl_exec($ch);
    if (!$roleName) {
        curl_close($ch);
        return false;
    }
    
    curl_setopt($ch, CURLOPT_URL, "http://169.254.169.254/latest/meta-data/iam/security-credentials/{$roleName}");
    $credentialsJson = curl_exec($ch);
    curl_close($ch);
    
    if (!$credentialsJson) {
        return false;
    }
    
    $credentials = json_decode($credentialsJson, true);
    return [
        'access_key' => $credentials['AccessKeyId'],
        'secret_key' => $credentials['SecretAccessKey'],
        'token' => $credentials['Token']
    ];
}

function createS3Signature($credentials, $region, $bucket, $s3Key, $headers, $payload, $timestamp, $date) {
    $service = 's3';
    $algorithm = 'AWS4-HMAC-SHA256';
    
    // Create canonical request
    $canonicalHeaders = '';
    $signedHeaders = '';
    ksort($headers);
    foreach ($headers as $name => $value) {
        $canonicalHeaders .= strtolower($name) . ':' . trim($value) . "\n";
        $signedHeaders .= strtolower($name) . ';';
    }
    $signedHeaders = rtrim($signedHeaders, ';');
    
    $canonicalRequest = "PUT\n/{$s3Key}\n\n{$canonicalHeaders}\n{$signedHeaders}\n" . hash('sha256', $payload);
    
    // Create string to sign
    $credentialScope = "{$date}/{$region}/{$service}/aws4_request";
    $stringToSign = "{$algorithm}\n{$timestamp}\n{$credentialScope}\n" . hash('sha256', $canonicalRequest);
    
    // Calculate signature
    $signingKey = hash_hmac('sha256', 'aws4_request', 
                  hash_hmac('sha256', $service,
                  hash_hmac('sha256', $region,
                  hash_hmac('sha256', $date, 'AWS4' . $credentials['secret_key'], true), true), true), true);
    
    $signature = hash_hmac('sha256', $stringToSign, $signingKey);
    
    return "{$algorithm} Credential={$credentials['access_key']}/{$credentialScope}, SignedHeaders={$signedHeaders}, Signature={$signature}";
}

function deleteFromS3($s3Key) {
    $bucket = 'jagasewa-assets-dev';
    $region = 'us-east-1';
    
    $credentials = getEC2Credentials();
    if (!$credentials) {
        return false;
    }
    
    $timestamp = gmdate('Ymd\THis\Z');
    $date = gmdate('Ymd');
    
    $headers = [
        'Host' => "{$bucket}.s3.{$region}.amazonaws.com",
        'X-Amz-Date' => $timestamp,
        'X-Amz-Security-Token' => $credentials['token']
    ];
    
    $signature = createS3DeleteSignature($credentials, $region, $bucket, $s3Key, $headers, $timestamp, $date);
    $headers['Authorization'] = $signature;
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => "https://{$bucket}.s3.{$region}.amazonaws.com/{$s3Key}",
        CURLOPT_CUSTOMREQUEST => 'DELETE',
        CURLOPT_HTTPHEADER => array_map(function($k, $v) { return "$k: $v"; }, array_keys($headers), $headers),
        CURLOPT_RETURNTRANSFER => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return $httpCode === 204;
}

function createS3DeleteSignature($credentials, $region, $bucket, $s3Key, $headers, $timestamp, $date) {
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