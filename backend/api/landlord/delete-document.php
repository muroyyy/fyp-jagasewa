<?php
include_once '../config/cors.php';
setCorsHeaders();


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Get authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$sessionToken = $matches[1];

// Get document_id from query parameter
$documentId = isset($_GET['document_id']) ? $_GET['document_id'] : null;

if (!$documentId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Document ID required']);
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

    // Get document details and verify ownership
    $stmt = $conn->prepare("
        SELECT file_path 
        FROM documents 
        WHERE document_id = ? AND landlord_id = ?
    ");
    $stmt->execute([$documentId, $landlordId]);
    $document = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$document) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Document not found or access denied']);
        exit();
    }

    // Soft delete (set is_active = 0)
    $stmt = $conn->prepare("
        UPDATE documents 
        SET is_active = 0, updated_at = NOW()
        WHERE document_id = ?
    ");
    $stmt->execute([$documentId]);

    // Optionally, delete physical file
    // Uncomment below if need to permanently delete files
    /*
    $filePath = '../../' . $document['file_path'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }
    */

    echo json_encode([
        'success' => true,
        'message' => 'Document deleted successfully'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>