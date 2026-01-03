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

// Get authorization token using helper function
$sessionToken = getBearerToken();

if (empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Verify session and get landlord_id
    $stmt = $conn->prepare("
        SELECT s.user_id, u.user_role, l.landlord_id 
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        JOIN landlords l ON u.user_id = l.user_id
        WHERE s.session_token = ? AND s.expires_at > NOW() AND u.user_role = 'landlord'
    ");
    $stmt->execute([$sessionToken]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit();
    }

    $landlordId = $session['landlord_id'];

    // Validate form data
    if (!isset($_POST['category']) || !isset($_POST['property_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing required fields']);
        exit();
    }

    // Debug file upload
    error_log('FILES array: ' . print_r($_FILES, true));
    error_log('POST array: ' . print_r($_POST, true));
    
    // Validate file upload
    if (!isset($_FILES['document'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No file uploaded']);
        exit();
    }
    
    if ($_FILES['document']['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
        ];
        
        $errorCode = $_FILES['document']['error'];
        $errorMessage = isset($errorMessages[$errorCode]) ? $errorMessages[$errorCode] : 'Unknown upload error';
        
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File upload failed: ' . $errorMessage]);
        exit();
    }

    $file = $_FILES['document'];
    $category = $_POST['category'];
    $propertyId = $_POST['property_id'];
    $tenantId = isset($_POST['tenant_id']) && !empty($_POST['tenant_id']) ? $_POST['tenant_id'] : null;
    $description = isset($_POST['description']) ? $_POST['description'] : '';

    // Validate file type
    $allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    $fileType = mime_content_type($file['tmp_name']);
    
    if (!in_array($fileType, $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid file type. Only PDF, images, Word, and Excel files are allowed.']);
        exit();
    }

    // Validate file size (max 10MB)
    $maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'File size exceeds 10MB limit']);
        exit();
    }

    // Verify property belongs to landlord
    $stmt = $conn->prepare("SELECT property_id FROM properties WHERE property_id = ? AND landlord_id = ?");
    $stmt->execute([$propertyId, $landlordId]);
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Property not found or access denied']);
        exit();
    }

    // If tenant_id provided, verify tenant belongs to this property
    if ($tenantId) {
        $stmt = $conn->prepare("SELECT tenant_id FROM tenants WHERE tenant_id = ? AND property_id = ?");
        $stmt->execute([$tenantId, $propertyId]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Tenant not found in this property']);
            exit();
        }
    }

    // Generate unique S3 key with sanitized filename
    $fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $originalFileName = pathinfo($file['name'], PATHINFO_FILENAME);
    $sanitizedFileName = sanitizeFilename($originalFileName);
    $s3Key = 'documents/landlord_' . $landlordId . '_' . time() . '_' . uniqid() . '_' . $sanitizedFileName . '.' . $fileExtension;
    
    // Upload to S3
    $s3Url = uploadToS3($file['tmp_name'], $s3Key, $fileType);
    if ($s3Url) {
        $filePath = $s3Url;
    } else {
        // Fallback to local storage
        $uploadDir = '../../uploads/documents/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $uniqueFileName = 'doc_' . $landlordId . '_' . time() . '_' . uniqid() . '_' . sanitizeFilename($originalFileName) . '.' . $fileExtension;
        $localPath = $uploadDir . $uniqueFileName;
        if (move_uploaded_file($file['tmp_name'], $localPath)) {
            $filePath = 'uploads/documents/' . $uniqueFileName;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save file']);
            exit();
        }
    }

    // Save to database
    $stmt = $conn->prepare("
        INSERT INTO documents 
        (landlord_id, property_id, tenant_id, file_name, file_path, file_type, file_size, category, description, is_active, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    ");

    $stmt->execute([
        $landlordId,
        $propertyId,
        $tenantId,
        $originalFileName . '.' . $fileExtension,
        $filePath,
        $fileType,
        $file['size'],
        $category,
        $description
    ]);

    $documentId = $conn->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Document uploaded successfully',
        'document_id' => $documentId
    ]);

} catch (PDOException $e) {
    // Delete file if database insert fails
    if (isset($filePath) && file_exists($filePath)) {
        unlink($filePath);
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>