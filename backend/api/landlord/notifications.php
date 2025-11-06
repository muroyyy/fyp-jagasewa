<?php
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

    // Mock notifications for now - in real implementation, these would come from database
    $notifications = [
        [
            'id' => 1,
            'type' => 'maintenance_request',
            'title' => 'New Maintenance Request',
            'message' => 'Tenant John Doe reported a leaking faucet in Property A',
            'property_name' => 'Sunset Apartments Unit 2A',
            'created_at' => date('Y-m-d H:i:s', strtotime('-2 hours')),
            'is_read' => false,
            'priority' => 'high'
        ],
        [
            'id' => 2,
            'type' => 'rent_payment',
            'title' => 'Rent Payment Received',
            'message' => 'Monthly rent payment of RM1,200 received from Jane Smith',
            'property_name' => 'Garden View Condo Unit 5B',
            'created_at' => date('Y-m-d H:i:s', strtotime('-1 day')),
            'is_read' => false,
            'priority' => 'medium'
        ],
        [
            'id' => 3,
            'type' => 'lease_expiry',
            'title' => 'Lease Expiring Soon',
            'message' => 'Lease for Mike Johnson expires in 30 days',
            'property_name' => 'Downtown Loft Unit 12',
            'created_at' => date('Y-m-d H:i:s', strtotime('-3 days')),
            'is_read' => true,
            'priority' => 'medium'
        ],
        [
            'id' => 4,
            'type' => 'document_upload',
            'title' => 'Document Uploaded',
            'message' => 'New lease agreement uploaded successfully',
            'property_name' => 'Riverside Apartments Unit 3C',
            'created_at' => date('Y-m-d H:i:s', strtotime('-1 week')),
            'is_read' => true,
            'priority' => 'low'
        ]
    ];

    // Count unread notifications
    $unreadCount = count(array_filter($notifications, function($n) { return !$n['is_read']; }));

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