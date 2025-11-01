<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

try {
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'No token provided']);
        exit();
    }

    $user_data = verifyJWT($token);
    if (!$user_data) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid token']);
        exit();
    }

    // Invalidate all user sessions
    $success = invalidateUserSessions($user_data['user_id']);
    
    if ($success) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Logout failed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>