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

    // Get recent activities from multiple sources
    $activities = [];

    // Recent user registrations
    $users_query = "SELECT 'user_registration' as type, email, user_role, created_at 
                    FROM users 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                    ORDER BY created_at DESC 
                    LIMIT 5";
    $users_stmt = $conn->prepare($users_query);
    $users_stmt->execute();
    $user_activities = $users_stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($user_activities as $activity) {
        $activities[] = [
            'description' => "New {$activity['user_role']} registered: {$activity['email']}",
            'timestamp' => date('M j, Y g:i A', strtotime($activity['created_at'])),
            'type' => 'user_registration'
        ];
    }

    // Recent property listings
    $properties_query = "SELECT p.property_name, l.full_name as landlord_name, p.created_at
                         FROM properties p
                         JOIN landlords l ON p.landlord_id = l.landlord_id
                         WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                         ORDER BY p.created_at DESC 
                         LIMIT 5";
    $properties_stmt = $conn->prepare($properties_query);
    $properties_stmt->execute();
    $property_activities = $properties_stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($property_activities as $activity) {
        $activities[] = [
            'description' => "New property listed: {$activity['property_name']} by {$activity['landlord_name']}",
            'timestamp' => date('M j, Y g:i A', strtotime($activity['created_at'])),
            'type' => 'property_listing'
        ];
    }

    // Recent admin actions (if admin_logs table exists)
    $admin_logs_query = "SELECT al.action, al.target_type, al.created_at, a.full_name as admin_name
                         FROM admin_logs al
                         JOIN admins a ON al.admin_id = a.admin_id
                         WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                         ORDER BY al.created_at DESC 
                         LIMIT 5";
    $admin_logs_stmt = $conn->prepare($admin_logs_query);
    $admin_logs_stmt->execute();
    $admin_activities = $admin_logs_stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($admin_activities as $activity) {
        $action_text = str_replace('_', ' ', $activity['action']);
        $activities[] = [
            'description' => "Admin {$activity['admin_name']} performed: {$action_text}",
            'timestamp' => date('M j, Y g:i A', strtotime($activity['created_at'])),
            'type' => 'admin_action'
        ];
    }

    // Sort all activities by timestamp (most recent first)
    usort($activities, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });

    // Limit to 10 most recent activities
    $activities = array_slice($activities, 0, 10);

    echo json_encode([
        'success' => true,
        'data' => $activities
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>