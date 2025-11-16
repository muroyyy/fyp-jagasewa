<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Check authentication
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Verify session token and check admin role
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role 
        FROM sessions s 
        WHERE s.session_token = :token AND s.expires_at > NOW() AND s.user_role = 'admin'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $user_data = ['user_id' => $session['user_id'], 'role' => $session['user_role']];

    if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        $user_id = $input['user_id'] ?? '';
        $is_active = $input['is_active'] ?? '';
        
        if (empty($user_id) || $is_active === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'User ID and status are required']);
            exit();
        }

        // Prevent admin from deactivating themselves
        if ($user_id == $user_data['user_id']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Cannot modify your own account status']);
            exit();
        }

        // Update user status
        $query = "UPDATE users SET is_active = :is_active, updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':is_active', $is_active, PDO::PARAM_INT);
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            // Log admin action
            $log_query = "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) 
                          VALUES ((SELECT admin_id FROM admins WHERE user_id = :admin_user_id), 
                                  :action, 'user', :target_id, :details)";
            $log_stmt = $conn->prepare($log_query);
            $action = $is_active ? 'activate_user' : 'deactivate_user';
            $details = json_encode(['user_id' => $user_id, 'new_status' => $is_active]);
            
            $log_stmt->bindParam(':admin_user_id', $user_data['user_id']);
            $log_stmt->bindParam(':action', $action);
            $log_stmt->bindParam(':target_id', $user_id);
            $log_stmt->bindParam(':details', $details);
            $log_stmt->execute();

            echo json_encode([
                'success' => true,
                'message' => 'User status updated successfully'
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>