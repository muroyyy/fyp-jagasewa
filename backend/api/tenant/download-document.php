<?php
include_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/s3_helper.php';

$token = getBearerToken();

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Verify session token
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role, t.tenant_id, t.property_id
        FROM sessions s
        JOIN tenants t ON s.user_id = t.user_id
        WHERE s.session_token = :token 
        AND s.expires_at > NOW()
        AND s.user_role = 'tenant'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit();
    }

    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $tenant_id = $session['tenant_id'];
    $property_id = $session['property_id'];

    // Get document ID from query parameter
    $document_id = $_GET['document_id'] ?? null;
    
    if (!$document_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Document ID required']);
        exit();
    }

    // Get document details and verify access
    $stmt = $conn->prepare("
        SELECT 
            d.document_id,
            d.file_name,
            d.file_path,
            d.file_type
        FROM documents d
        WHERE d.document_id = :document_id
        AND (d.tenant_id = :tenant_id OR d.property_id = :property_id)
        AND d.is_active = 1
    ");
    $stmt->bindParam(':document_id', $document_id);
    $stmt->bindParam(':tenant_id', $tenant_id);
    $stmt->bindParam(':property_id', $property_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Document not found or access denied']);
        exit();
    }

    $document = $stmt->fetch(PDO::FETCH_ASSOC);

    if (strpos($document['file_path'], 'https://') === 0) {
        // S3 file - redirect to pre-signed URL
        $s3Key = str_replace('https://jagasewa-assets-prod.s3.ap-southeast-1.amazonaws.com/', '', $document['file_path']);
        $presignedUrl = generatePresignedUrl($s3Key, 60);
        
        if ($presignedUrl) {
            header('Location: ' . $presignedUrl);
            exit();
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to generate download URL']);
            exit();
        }
    } else {
        // Local file - serve directly
        $filePath = '../../' . $document['file_path'];
        
        if (!file_exists($filePath)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'File not found']);
            exit();
        }

        header('Content-Type: ' . $document['file_type']);
        header('Content-Disposition: attachment; filename="' . $document['file_name'] . '"');
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit();
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>