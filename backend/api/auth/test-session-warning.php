<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/auth_helper.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

try {
    // Authenticate user
    $user = authenticate();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit;
    }
    
    $database = new Database();
    $db = $database->getConnection();
    
    // Get current session token
    $token = getBearerToken();
    
    // Set session to expire in 35 seconds (to trigger warning)
    $new_expiry = date('Y-m-d H:i:s', strtotime('+35 seconds'));
    
    $query = "UPDATE sessions 
              SET expires_at = :new_expiry 
              WHERE session_token = :token AND user_id = :user_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':new_expiry', $new_expiry);
    $stmt->bindParam(':token', $token);
    $stmt->bindParam(':user_id', $user['user_id']);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Session set to expire in 35 seconds for testing',
            'expires_at' => $new_expiry
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update session']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>