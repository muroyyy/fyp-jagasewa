<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/auth_helper.php';
require_once '../config/s3_helper.php';

$user = authenticate();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$property_id = $_POST['property_id'] ?? null;
$receiver_id = $_POST['receiver_id'] ?? null;
$message = $_POST['message'] ?? '';

if (!$property_id || !$receiver_id) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];
$allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
$max_size = 5 * 1024 * 1024; // 5MB

if (!in_array($file['type'], $allowed_types)) {
    http_response_code(400);
    echo json_encode(['error' => 'File type not allowed']);
    exit;
}

if ($file['size'] > $max_size) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large']);
    exit;
}

// Generate unique filename for S3
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid() . '_' . time() . '.' . $extension;
$s3Key = 'messages/' . $filename;

// Upload to S3
$s3Url = uploadToS3($file['tmp_name'], $s3Key, $file['type']);
if (!$s3Url) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to upload file to S3']);
    exit;
}

// Determine message type
$message_type = strpos($file['type'], 'image/') === 0 ? 'image' : 'document';

// Save to database
try {
    $stmt = $pdo->prepare("
        INSERT INTO messages (property_id, sender_id, receiver_id, message, message_type, attachment_path)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $property_id,
        $user['user_id'],
        $receiver_id,
        $message ?: $file['name'],
        $message_type,
        $s3Key
    ]);
    
    echo json_encode([
        'success' => true,
        'message_id' => $pdo->lastInsertId(),
        'filename' => $filename,
        'message_type' => $message_type
    ]);
    
} catch (Exception $e) {
    // Delete from S3 if database insert fails
    deleteFromS3($s3Key);
    http_response_code(500);
    echo json_encode(['error' => 'Database error']);
}
?>