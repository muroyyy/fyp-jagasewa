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

try {
    $sessionToken = getBearerToken();

    if (empty($sessionToken)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $database = new Database();
    $conn = $database->getConnection();           // Primary for session verification
    $readConn = $database->getReadConnection();   // Replica for read-only queries

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

    // Check if requesting all notifications (for notifications page)
    $fetchAll = isset($_GET['all']) && $_GET['all'] === 'true';

    // Check cache first (only for dropdown, not for full page)
    $cachedNotifications = null;
    if (!$fetchAll) {
        $cachedNotifications = TenantCache::get($tenantId, 'notifications');
    }

    if ($cachedNotifications !== null) {
        $notifications = $cachedNotifications['notifications'];
        $unreadCount = $cachedNotifications['unread_count'];
    } else {
        // Set limits based on request type
        $maintenanceLimit = $fetchAll ? 20 : 5;
        $paymentLimit = $fetchAll ? 20 : 5;
        $documentLimit = $fetchAll ? 10 : 3;
        $totalLimit = $fetchAll ? 50 : 10;
        $dateInterval = $fetchAll ? 90 : 30;

        // Get property name for notifications (using read replica)
        $propertyName = '';
        if ($propertyId) {
            $propStmt = $readConn->prepare("SELECT property_name FROM properties WHERE property_id = ?");
            $propStmt->execute([$propertyId]);
            $propResult = $propStmt->fetch(PDO::FETCH_ASSOC);
            $propertyName = $propResult ? $propResult['property_name'] : '';
        }

        // Consolidated query for tenant notifications
        $notificationsQuery = "
            (SELECT
                CONCAT('maintenance_', mr.request_id) as id,
                'maintenance_update' as type,
                CASE
                    WHEN mr.status = 'completed' THEN 'Maintenance Completed'
                    WHEN mr.status = 'in_progress' THEN 'Maintenance In Progress'
                    WHEN mr.landlord_response IS NOT NULL THEN 'Landlord Responded'
                    ELSE 'Maintenance Request Submitted'
                END as title,
                CASE
                    WHEN mr.status = 'completed' THEN CONCAT('Your request \"', mr.title, '\" has been completed')
                    WHEN mr.status = 'in_progress' THEN CONCAT('Work has started on \"', mr.title, '\"')
                    WHEN mr.landlord_response IS NOT NULL THEN CONCAT('Landlord responded to \"', mr.title, '\"')
                    ELSE CONCAT('You submitted: ', mr.title)
                END as message,
                p.property_name,
                COALESCE(mr.response_date, mr.created_at) as created_at,
                CASE
                    WHEN mr.status = 'completed' THEN 'low'
                    WHEN mr.priority = 'urgent' THEN 'high'
                    ELSE 'medium'
                END as priority,
                CONCAT('/tenant/maintenance?request_id=', mr.request_id) as link_url,
                mr.request_id as reference_id
            FROM maintenance_requests mr
            JOIN properties p ON mr.property_id = p.property_id
            WHERE mr.tenant_id = ?
            AND mr.created_at >= DATE_SUB(NOW(), INTERVAL {$dateInterval} DAY)
            ORDER BY COALESCE(mr.response_date, mr.created_at) DESC
            LIMIT {$maintenanceLimit})

            UNION ALL

            (SELECT
                CONCAT('payment_', pay.payment_id) as id,
                IF(pay.status = 'completed', 'payment_confirmed', 'payment_reminder') as type,
                IF(pay.status = 'completed', 'Payment Confirmed', 'Payment Received') as title,
                IF(pay.status = 'completed',
                    CONCAT('Your payment of RM', FORMAT(pay.amount, 2), ' has been confirmed'),
                    CONCAT('Payment of RM', FORMAT(pay.amount, 2), ' received')
                ) as message,
                pr.property_name,
                pay.payment_date as created_at,
                IF(pay.status = 'completed', 'low', 'medium') as priority,
                CONCAT('/tenant/payments?payment_id=', pay.payment_id) as link_url,
                pay.payment_id as reference_id
            FROM payments pay
            JOIN tenants t ON pay.tenant_id = t.tenant_id
            JOIN properties pr ON t.property_id = pr.property_id
            WHERE pay.tenant_id = ?
            AND pay.payment_date >= DATE_SUB(NOW(), INTERVAL {$dateInterval} DAY)
            ORDER BY pay.payment_date DESC
            LIMIT {$paymentLimit})

            UNION ALL

            (SELECT
                CONCAT('system_payment_', sm.message_id) as id,
                'payment_reminder' as type,
                'Payment Reminder' as title,
                sm.message as message,
                p.property_name,
                sm.created_at as created_at,
                'medium' as priority,
                '/tenant/payments' as link_url,
                sm.reference_id as reference_id
            FROM system_messages sm
            LEFT JOIN properties p ON sm.property_id = p.property_id
            WHERE sm.receiver_id = ?
            AND sm.message_type = 'system_payment'
            AND sm.created_at >= DATE_SUB(NOW(), INTERVAL {$dateInterval} DAY)
            ORDER BY sm.created_at DESC
            LIMIT {$paymentLimit})

            UNION ALL

            (SELECT
                CONCAT('document_', d.document_id) as id,
                'document_shared' as type,
                'New Document Shared' as title,
                CONCAT('A new document \"', d.file_name, '\" has been shared with you') as message,
                p.property_name,
                d.uploaded_at as created_at,
                'medium' as priority,
                '/tenant/documents' as link_url,
                d.document_id as reference_id
            FROM documents d
            JOIN properties p ON d.property_id = p.property_id
            WHERE d.property_id = ?
            AND d.uploaded_at >= DATE_SUB(NOW(), INTERVAL {$dateInterval} DAY)
            ORDER BY d.uploaded_at DESC
            LIMIT {$documentLimit})

            ORDER BY created_at DESC
            LIMIT {$totalLimit}
        ";

        $stmt = $readConn->prepare($notificationsQuery);
        $stmt->execute([$tenantId, $tenantId, $tenantId, $propertyId ?: 0]);
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

        // Cache the results (only for dropdown)
        if (!$fetchAll) {
            TenantCache::set($tenantId, 'notifications', [
                'notifications' => $notifications,
                'unread_count' => $unreadCount
            ]);
        }
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
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
