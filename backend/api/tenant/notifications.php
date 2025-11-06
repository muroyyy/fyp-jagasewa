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

    // Fetch real notifications from database
    $notifications = [];
    
    // 1. Get upcoming rent payments (next 7 days)
    $stmt = $conn->prepare("
        SELECT 
            p.property_name,
            p.monthly_rent,
            t.move_in_date
        FROM properties p
        JOIN tenants t ON p.property_id = t.property_id
        WHERE t.tenant_id = ?
    ");
    $stmt->execute([$tenantId]);
    $property = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($property) {
        // Calculate next payment date (assuming monthly on move-in date)
        $moveInDay = date('d', strtotime($property['move_in_date']));
        $currentMonth = date('Y-m');
        $nextPaymentDate = $currentMonth . '-' . str_pad($moveInDay, 2, '0', STR_PAD_LEFT);
        
        // If payment date has passed this month, set to next month
        if (strtotime($nextPaymentDate) < time()) {
            $nextPaymentDate = date('Y-m-d', strtotime($nextPaymentDate . ' +1 month'));
        }
        
        $daysUntilPayment = ceil((strtotime($nextPaymentDate) - time()) / (60 * 60 * 24));
        
        if ($daysUntilPayment <= 7 && $daysUntilPayment >= 0) {
            $notifications[] = [
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
            ];
        }
    }
    
    // 2. Get maintenance request updates (last 30 days)
    $maintenanceQuery = "
        SELECT 
            mr.request_id,
            mr.title,
            mr.status,
            mr.landlord_response,
            mr.updated_at,
            p.property_name
        FROM maintenance_requests mr
        JOIN properties p ON mr.property_id = p.property_id
        WHERE mr.tenant_id = ?
        AND mr.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND mr.landlord_response IS NOT NULL
        ORDER BY mr.updated_at DESC
        LIMIT 5
    ";
    
    $stmt = $conn->prepare($maintenanceQuery);
    $stmt->execute([$tenantId]);
    $maintenanceUpdates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($maintenanceUpdates as $update) {
        $notifications[] = [
            'id' => 'maintenance_update_' . $update['request_id'],
            'type' => 'maintenance_update',
            'title' => 'Maintenance Request Update',
            'message' => 'Your request "' . $update['title'] . '" has been updated',
            'property_name' => $update['property_name'],
            'created_at' => $update['updated_at'],
            'is_read' => false,
            'priority' => 'medium',
            'link_url' => '/tenant/maintenance?request_id=' . $update['request_id'],
            'reference_id' => $update['request_id']
        ];
    }
    
    // 3. Get new documents shared (last 30 days)
    $documentsQuery = "
        SELECT 
            d.document_id,
            d.file_name,
            d.category,
            d.uploaded_at,
            p.property_name
        FROM documents d
        JOIN properties p ON d.property_id = p.property_id
        WHERE (d.tenant_id = ? OR d.tenant_id IS NULL)
        AND d.property_id = ?
        AND d.uploaded_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY d.uploaded_at DESC
        LIMIT 5
    ";
    
    $stmt = $conn->prepare($documentsQuery);
    $stmt->execute([$tenantId, $propertyId]);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($documents as $doc) {
        $notifications[] = [
            'id' => 'document_' . $doc['document_id'],
            'type' => 'document_shared',
            'title' => 'New Document Shared',
            'message' => 'Your landlord shared: ' . $doc['file_name'],
            'property_name' => $doc['property_name'],
            'created_at' => $doc['uploaded_at'],
            'is_read' => false,
            'priority' => 'low',
            'link_url' => '/tenant/documents?document_id=' . $doc['document_id'],
            'reference_id' => $doc['document_id']
        ];
    }
    
    // 4. Check for overdue payments
    $stmt = $conn->prepare("
        SELECT 
            COUNT(*) as overdue_count,
            SUM(p.monthly_rent) as total_overdue
        FROM tenants t
        JOIN properties p ON t.property_id = p.property_id
        LEFT JOIN payments pay ON t.tenant_id = pay.tenant_id 
            AND pay.payment_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            AND pay.status = 'completed'
        WHERE t.tenant_id = ?
        AND t.move_in_date <= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        AND pay.payment_id IS NULL
    ");
    $stmt->execute([$tenantId]);
    $overdueInfo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($overdueInfo['overdue_count'] > 0) {
        $notifications[] = [
            'id' => 'overdue_payment_' . $tenantId,
            'type' => 'payment_overdue',
            'title' => 'Overdue Payment',
            'message' => 'You have overdue rent of RM' . number_format($overdueInfo['total_overdue'], 2),
            'property_name' => $property['property_name'],
            'created_at' => date('Y-m-d H:i:s'),
            'is_read' => false,
            'priority' => 'high',
            'link_url' => '/tenant/payments',
            'reference_id' => $tenantId
        ];
    }
    
    // Sort all notifications by created_at desc
    usort($notifications, function($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });
    
    // Limit to 10 most recent
    $notifications = array_slice($notifications, 0, 10);
    
    // Count unread notifications (all for now)
    $unreadCount = count($notifications);

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