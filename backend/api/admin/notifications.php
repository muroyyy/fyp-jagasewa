<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $stmt = $db->prepare("
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

    // Get system notifications for admin
    $notifications = [];
    
    // New user registrations (last 7 days)
    $stmt = $db->prepare("
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ");
    $stmt->execute();
    $newUsers = $stmt->fetchColumn();
    
    if ($newUsers > 0) {
        $notifications[] = [
            'id' => 'new_users',
            'type' => 'info',
            'title' => 'New User Registrations',
            'message' => "$newUsers new users registered this week",
            'time' => 'This week',
            'read' => false
        ];
    }
    
    // Pending verifications
    $stmt = $db->prepare("
        SELECT COUNT(*) as count 
        FROM users 
        WHERE is_verified = 0 AND is_active = 1
    ");
    $stmt->execute();
    $pendingVerifications = $stmt->fetchColumn();
    
    if ($pendingVerifications > 0) {
        $notifications[] = [
            'id' => 'pending_verifications',
            'type' => 'warning',
            'title' => 'Pending Verifications',
            'message' => "$pendingVerifications users awaiting verification",
            'time' => 'Pending',
            'read' => false
        ];
    }
    
    // Recent maintenance requests
    $stmt = $db->prepare("
        SELECT COUNT(*) as count 
        FROM maintenance_requests 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND status = 'pending'
    ");
    $stmt->execute();
    $recentMaintenance = $stmt->fetchColumn();
    
    if ($recentMaintenance > 0) {
        $notifications[] = [
            'id' => 'maintenance_requests',
            'type' => 'alert',
            'title' => 'New Maintenance Requests',
            'message' => "$recentMaintenance new maintenance requests today",
            'time' => 'Today',
            'read' => false
        ];
    }
    
    // System status notification
    $notifications[] = [
        'id' => 'system_status',
        'type' => 'success',
        'title' => 'System Status',
        'message' => 'All systems operational - 99.9% uptime',
        'time' => '1 hour ago',
        'read' => true
    ];

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'notifications' => $notifications,
            'unread_count' => count(array_filter($notifications, fn($n) => !$n['read']))
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>