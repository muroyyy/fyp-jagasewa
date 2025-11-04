<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $data = json_decode(file_get_contents("php://input"));
    $refresh_token = $data->refresh_token ?? null;

    if (!$refresh_token) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Refresh token required']);
        exit();
    }

    // Verify refresh token
    $query = "SELECT user_id, user_role FROM sessions WHERE refresh_token = :refresh_token AND expires_at > NOW()";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':refresh_token', $refresh_token);
    $stmt->execute();
    
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid refresh token']);
        exit();
    }

    // Generate new tokens
    $new_session_token = bin2hex(random_bytes(32));
    $new_refresh_token = generateRefreshToken();
    $new_expiry = date('Y-m-d H:i:s', strtotime('+2 hours'));

    // Update session with new tokens
    $update_query = "UPDATE sessions SET session_token = :session_token, refresh_token = :refresh_token, expires_at = :expires_at WHERE refresh_token = :old_refresh_token";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->bindParam(':session_token', $new_session_token);
    $update_stmt->bindParam(':refresh_token', $new_refresh_token);
    $update_stmt->bindParam(':expires_at', $new_expiry);
    $update_stmt->bindParam(':old_refresh_token', $refresh_token);
    
    if ($update_stmt->execute()) {
        echo json_encode([
            'success' => true,
            'session_token' => $new_session_token,
            'refresh_token' => $new_refresh_token
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Token refresh failed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>