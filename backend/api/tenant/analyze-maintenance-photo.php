<?php
include_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/auth_helper.php';
require_once '../../config/rekognition_helper.php';

$token = getBearerToken();

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    // Verify token
    require_once '../../config/database.php';
    $database = new Database();
    $conn = $database->getConnection();

    $stmt = $conn->prepare("SELECT user_role FROM sessions WHERE session_token = :token AND expires_at > NOW()");
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid session']);
        exit();
    }

    // Get uploaded image
    if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No photo uploaded']);
        exit();
    }

    $imageBytes = file_get_contents($_FILES['photo']['tmp_name']);
    
    // Get description for context (optional)
    $description = isset($_POST['description']) ? $_POST['description'] : '';
    
    // Analyze with Rekognition using description context
    $result = analyzeMaintenancePhoto($imageBytes, $description);

    if ($result['success']) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $result['analysis']
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $result['error']]);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Analysis failed: ' . $e->getMessage()]);
}
?>
