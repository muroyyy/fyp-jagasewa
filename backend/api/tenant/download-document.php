<?php
include_once '../config/cors.php';
setCorsHeaders();


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Get Authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader)) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Authorization header missing'
    ]);
    exit();
}

// Extract token
$token = str_replace('Bearer ', '', $authHeader);

// Get document ID from query parameter
$document_id = isset($_GET['document_id']) ? $_GET['document_id'] : null;

if (empty($document_id)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Document ID is required'
    ]);
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
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or expired session'
        ]);
        exit();
    }

    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $tenant_id = $session['tenant_id'];
    $property_id = $session['property_id'];

    // Get document and verify access
    $stmt = $conn->prepare("
        SELECT 
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
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'Document not found or access denied'
        ]);
        exit();
    }

    $document = $stmt->fetch(PDO::FETCH_ASSOC);
    $file_path = '../../' . $document['file_path']; // Adjust path as needed

    // Check if file exists
    if (!file_exists($file_path)) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'File not found on server'
        ]);
        exit();
    }

    // Set headers for file download
    header('Content-Type: ' . $document['file_type']);
    header('Content-Disposition: attachment; filename="' . $document['file_name'] . '"');
    header('Content-Length: ' . filesize($file_path));
    header('Cache-Control: must-revalidate');
    header('Pragma: public');

    // Output file
    readfile($file_path);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>