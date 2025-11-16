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

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all system settings
        $query = "SELECT setting_key, setting_value FROM system_settings";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $settings_rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Convert to key-value array
        $settings = [];
        foreach ($settings_rows as $row) {
            $settings[$row['setting_key']] = $row['setting_value'];
        }

        // Set defaults if not exists
        $default_settings = [
            'platform_commission_rate' => '5.0',
            'max_properties_per_landlord' => '50',
            'maintenance_auto_assign' => 'false',
            'email_notifications_enabled' => 'true',
            'platform_maintenance_mode' => 'false',
            'max_file_upload_size' => '10',
            'session_timeout_hours' => '2',
            'password_min_length' => '8'
        ];

        foreach ($default_settings as $key => $default_value) {
            if (!isset($settings[$key])) {
                $settings[$key] = $default_value;
            }
        }

        echo json_encode([
            'success' => true,
            'data' => $settings
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Update system settings
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Settings data required']);
            exit();
        }

        // Get admin_id
        $admin_query = "SELECT admin_id FROM admins WHERE user_id = :user_id";
        $admin_stmt = $conn->prepare($admin_query);
        $admin_stmt->bindParam(':user_id', $user_data['user_id']);
        $admin_stmt->execute();
        $admin_data = $admin_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$admin_data) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Admin profile not found']);
            exit();
        }

        $admin_id = $admin_data['admin_id'];

        // Update each setting
        foreach ($input as $key => $value) {
            // Check if setting exists
            $check_query = "SELECT setting_id FROM system_settings WHERE setting_key = :setting_key";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->bindParam(':setting_key', $key);
            $check_stmt->execute();

            if ($check_stmt->rowCount() > 0) {
                // Update existing setting
                $update_query = "UPDATE system_settings 
                                SET setting_value = :setting_value, updated_by = :updated_by, updated_at = CURRENT_TIMESTAMP 
                                WHERE setting_key = :setting_key";
                $update_stmt = $conn->prepare($update_query);
                $update_stmt->bindParam(':setting_value', $value);
                $update_stmt->bindParam(':updated_by', $admin_id);
                $update_stmt->bindParam(':setting_key', $key);
                $update_stmt->execute();
            } else {
                // Insert new setting
                $insert_query = "INSERT INTO system_settings (setting_key, setting_value, updated_by) 
                                VALUES (:setting_key, :setting_value, :updated_by)";
                $insert_stmt = $conn->prepare($insert_query);
                $insert_stmt->bindParam(':setting_key', $key);
                $insert_stmt->bindParam(':setting_value', $value);
                $insert_stmt->bindParam(':updated_by', $admin_id);
                $insert_stmt->execute();
            }
        }

        // Log admin action
        $log_query = "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) 
                      VALUES (:admin_id, 'update_system_settings', 'system', NULL, :details)";
        $log_stmt = $conn->prepare($log_query);
        $details = json_encode($input);
        
        $log_stmt->bindParam(':admin_id', $admin_id);
        $log_stmt->bindParam(':details', $details);
        $log_stmt->execute();

        echo json_encode([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>