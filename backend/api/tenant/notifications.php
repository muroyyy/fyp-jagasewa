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
require_once '../../config/tenant_cache.php';

$sessionToken = getBearerToken();

if (empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Verify session and get tenant_id
    $stmt = $conn->prepare("
        SELECT s.user_id, u.user_role, t.tenant_id, t.property_id
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        JOIN tenants t ON u.user_id = t.user_id
        WHERE s.session_token = ? AND s.expires_at > NOW() AND u.user_role = 'tenant'
    ");
    $stmt->execute([$sessionToken]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit();
    }

    $tenantId = $session['tenant_id'];
    $propertyId = $session['property_id'];

    // Check cache first
    $cachedNotifications = TenantCache::get($tenantId, 'notifications');
    
    if ($cachedNotifications !== null) {
        $notifications = $cachedNotifications['notifications'];
        $unreadCount = $cachedNotifications['unread_count'];
    } else {
        // Consolidated query: Get all notification data using UNION
        $notificationsQuery = "
            (SELECT 
                CONCAT('maintenance_update_', mr.request_id) as id,
                'maintenance_update' as type,
                'Maintenance Request Update' as title,
                CONCAT('Your request "', mr.title, '" has been updated') as message,
                p.property_name,
                mr.updated_at as created_at,
                'medium' as priority,
                CONCAT('/tenant/maintenance?request_id=', mr.request_id) as link_url,
                mr.request_id as reference_id
            FROM maintenance_requests mr
            JOIN properties p ON mr.property_id = p.property_id
            WHERE mr.tenant_id = ?
            AND mr.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND mr.landlord_response IS NOT NULL
            ORDER BY mr.updated_at DESC
            LIMIT 5)
            
            UNION ALL
            
            (SELECT 
                CONCAT('document_', d.document_id) as id,
                'document_shared' as type,
                'New Document Shared' as title,
                CONCAT('Your landlord shared: ', d.file_name) as message,
                p.property_name,
                d.uploaded_at as created_at,
                'low' as priority,
                CONCAT('/tenant/documents?document_id=', d.document_id) as link_url,
                d.document_id as reference_id
            FROM documents d
            JOIN properties p ON d.property_id = p.property_id
            WHERE (d.tenant_id = ? OR d.tenant_id IS NULL)
            AND d.property_id = ?
            AND d.uploaded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY d.uploaded_at DESC
            LIMIT 5)
            
            ORDER BY created_at DESC
            LIMIT 10
        ";
        
        $stmt = $conn->prepare($notificationsQuery);
        $stmt->execute([$tenantId, $tenantId, $propertyId]);
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
        
        // Add rent due notification if applicable
        $stmt = $conn->prepare("
            SELECT p.property_name, p.monthly_rent, t.move_in_date
            FROM properties p
            JOIN tenants t ON p.property_id = t.property_id
            WHERE t.tenant_id = ?
        ");
        $stmt->execute([$tenantId]);
        $property = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($property) {
            $moveInDay = date('d', strtotime($property['move_in_date']));
            $currentMonth = date('Y-m');
            $nextPaymentDate = $currentMonth . '-' . str_pad($moveInDay, 2, '0', STR_PAD_LEFT);
            
            if (strtotime($nextPaymentDate) < time()) {
                $nextPaymentDate = date('Y-m-d', strtotime($nextPaymentDate . ' +1 month'));
            }
            
            $daysUntilPayment = ceil((strtotime($nextPaymentDate) - time()) / (60 * 60 * 24));
            
            if ($daysUntilPayment <= 7 && $daysUntilPayment >= 0) {
                array_unshift($notifications, [
                    'id' => 'rent_due_' . $tenantId,
                    'type' => 'rent_due',
                    'title' => 'Rent Payment Due Soon',
                    'message' => 'Your rent of RM' . number_format($property['monthly_rent'], 2) . ' is due in ' . $daysUntilPayment . ' days',
                    'property_name' => $property['property_name'],
                    'created_at' => date('Y-m-d H:i:s'),
                    'is_read' => false,
                    'priority' => $daysUntilPayment <= 3 ? 'high' : 'medium',
                    'link_url' => '/tenant/payments',
                    'reference_id' => $tenantId
                ]);
            }
        }
        
        $notifications = array_slice($notifications, 0, 10);
        $unreadCount = count($notifications);
        
        // Cache the results
        TenantCache::set($tenantId, 'notifications', [
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
    error_log("Tenant Notifications Error: " . $e->getMessage() . " | Trace: " . $e->getTraceAsString());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>