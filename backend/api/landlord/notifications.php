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

    // Fetch real notifications from database
    $notifications = [];
    
    // 1. Get recent maintenance requests (last 30 days)
    $maintenanceQuery = "
        SELECT 
            mr.request_id,
            mr.title,
            mr.priority,
            mr.created_at,
            p.property_name,
            t.full_name as tenant_name
        FROM maintenance_requests mr
        JOIN properties p ON mr.property_id = p.property_id
        JOIN tenants t ON mr.tenant_id = t.tenant_id
        WHERE p.landlord_id = ? 
        AND mr.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY mr.created_at DESC
        LIMIT 5
    ";
    
    $stmt = $conn->prepare($maintenanceQuery);
    $stmt->execute([$landlordId]);
    $maintenanceRequests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($maintenanceRequests as $request) {
        $notifications[] = [
            'id' => 'maintenance_' . $request['request_id'],
            'type' => 'maintenance_request',
            'title' => 'New Maintenance Request',
            'message' => $request['tenant_name'] . ' reported: ' . $request['title'],
            'property_name' => $request['property_name'],
            'created_at' => $request['created_at'],
            'is_read' => false,
            'priority' => $request['priority'] === 'urgent' ? 'high' : 'medium',
            'link_url' => '/landlord/maintenance?request_id=' . $request['request_id'],
            'reference_id' => $request['request_id']
        ];
    }
    
    // 2. Get recent payments (last 30 days)
    $paymentsQuery = "
        SELECT 
            p.payment_id,
            p.amount,
            p.payment_date,
            p.status,
            pr.property_name,
            t.full_name as tenant_name
        FROM payments p
        JOIN tenants t ON p.tenant_id = t.tenant_id
        JOIN properties pr ON t.property_id = pr.property_id
        WHERE pr.landlord_id = ?
        AND p.payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY p.payment_date DESC
        LIMIT 5
    ";
    
    $stmt = $conn->prepare($paymentsQuery);
    $stmt->execute([$landlordId]);
    $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($payments as $payment) {
        $notifications[] = [
            'id' => 'payment_' . $payment['payment_id'],
            'type' => 'rent_payment',
            'title' => $payment['status'] === 'completed' ? 'Payment Received' : 'Payment Pending',
            'message' => $payment['tenant_name'] . ' paid RM' . number_format($payment['amount'], 2),
            'property_name' => $payment['property_name'],
            'created_at' => $payment['payment_date'],
            'is_read' => false,
            'priority' => $payment['status'] === 'completed' ? 'medium' : 'high',
            'link_url' => '/landlord/payments?payment_id=' . $payment['payment_id'],
            'reference_id' => $payment['payment_id']
        ];
    }
    
    // 3. Get overdue payments
    $overdueQuery = "
        SELECT 
            t.tenant_id,
            t.full_name as tenant_name,
            pr.property_name,
            pr.monthly_rent,
            t.move_in_date
        FROM tenants t
        JOIN properties pr ON t.property_id = pr.property_id
        LEFT JOIN payments p ON t.tenant_id = p.tenant_id 
            AND p.payment_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
            AND p.status = 'completed'
        WHERE pr.landlord_id = ?
        AND p.payment_id IS NULL
        AND t.move_in_date <= DATE_SUB(NOW(), INTERVAL 1 MONTH)
        LIMIT 3
    ";
    
    $stmt = $conn->prepare($overdueQuery);
    $stmt->execute([$landlordId]);
    $overduePayments = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($overduePayments as $overdue) {
        $notifications[] = [
            'id' => 'overdue_' . $overdue['tenant_id'],
            'type' => 'payment_overdue',
            'title' => 'Overdue Payment',
            'message' => $overdue['tenant_name'] . ' has overdue rent of RM' . number_format($overdue['monthly_rent'], 2),
            'property_name' => $overdue['property_name'],
            'created_at' => date('Y-m-d H:i:s'),
            'is_read' => false,
            'priority' => 'high',
            'link_url' => '/landlord/payments?tenant_id=' . $overdue['tenant_id'],
            'reference_id' => $overdue['tenant_id']
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