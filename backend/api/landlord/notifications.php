<?php
// Suppress all PHP notices and warnings to prevent HTML output
error_reporting(E_ERROR | E_PARSE);
ini_set('display_errors', 0);

include_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/landlord_cache.php';

$sessionToken = getBearerToken();

if (empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
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

    // Check cache first
    $cachedNotifications = LandlordCache::get($landlordId, 'notifications');
    
    if ($cachedNotifications !== null) {
        $notifications = $cachedNotifications['notifications'];
        $unreadCount = $cachedNotifications['unread_count'];
    } else {
        // Consolidated query: Get all notification data in one query using UNION
        $notificationsQuery = "
            (SELECT 
                CONCAT('maintenance_', mr.request_id) as id,
                'maintenance_request' as type,
                'New Maintenance Request' as title,
                CONCAT(t.full_name, ' reported: ', mr.title) as message,
                p.property_name,
                mr.created_at,
                IF(mr.priority = 'urgent', 'high', 'medium') as priority,
                CONCAT('/landlord/maintenance?request_id=', mr.request_id) as link_url,
                mr.request_id as reference_id
            FROM maintenance_requests mr
            JOIN properties p ON mr.property_id = p.property_id
            JOIN tenants t ON mr.tenant_id = t.tenant_id
            WHERE p.landlord_id = ? 
            AND mr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY mr.created_at DESC
            LIMIT 5)
            
            UNION ALL
            
            (SELECT 
                CONCAT('payment_', pay.payment_id) as id,
                'rent_payment' as type,
                IF(pay.status = 'completed', 'Payment Received', 'Payment Pending') as title,
                CONCAT(t.full_name, ' paid RM', FORMAT(pay.amount, 2)) as message,
                pr.property_name,
                pay.payment_date as created_at,
                IF(pay.status = 'completed', 'medium', 'high') as priority,
                CONCAT('/landlord/payments?payment_id=', pay.payment_id) as link_url,
                pay.payment_id as reference_id
            FROM payments pay
            JOIN tenants t ON pay.tenant_id = t.tenant_id
            JOIN properties pr ON t.property_id = pr.property_id
            WHERE pr.landlord_id = ?
            AND pay.payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY pay.payment_date DESC
            LIMIT 5)
            
            UNION ALL
            
            (SELECT 
                CONCAT('overdue_', t.tenant_id) as id,
                'payment_overdue' as type,
                'Overdue Payment' as title,
                CONCAT(t.full_name, ' has overdue rent of RM', FORMAT(pr.monthly_rent, 2)) as message,
                pr.property_name,
                NOW() as created_at,
                'high' as priority,
                CONCAT('/landlord/payments?tenant_id=', t.tenant_id) as link_url,
                t.tenant_id as reference_id
            FROM tenants t
            JOIN properties pr ON t.property_id = pr.property_id
            LEFT JOIN payments p ON t.tenant_id = p.tenant_id 
                AND p.payment_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
                AND p.status = 'completed'
            WHERE pr.landlord_id = ?
            AND p.payment_id IS NULL
            AND t.move_in_date <= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            LIMIT 3)
            
            ORDER BY created_at DESC
            LIMIT 10
        ";
        
        $stmt = $conn->prepare($notificationsQuery);
        $stmt->execute([$landlordId, $landlordId, $landlordId]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $notifications = [];
        foreach ($results as $row) {
            $notifications[] = [
                'id' => $row['id'],
                'type' => $row['type'],
                'title' => $row['title'],
                'message' => $row['message'],
                'property_name' => $row['property_name'],
                'created_at' => $row['created_at'],
                'is_read' => false,
                'priority' => $row['priority'],
                'link_url' => $row['link_url'],
                'reference_id' => $row['reference_id']
            ];
        }
        
        $unreadCount = count($notifications);
        
        // Cache the results
        LandlordCache::set($landlordId, 'notifications', [
            'notifications' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
            'total_count' => count($notifications)
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>