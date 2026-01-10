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
    $conn = $database->getConnection();           // Primary for session verification
    $readConn = $database->getReadConnection();   // Replica for read-only queries

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

    // Get tenants for this landlord's properties (using read replica)
    $stmt = $readConn->prepare("
        SELECT DISTINCT t.tenant_id, t.full_name as tenant_name
        FROM tenants t
        JOIN properties pr ON t.property_id = pr.property_id
        WHERE pr.landlord_id = ? AND t.property_id IS NOT NULL
        ORDER BY t.full_name
    ");
    $stmt->execute([$landlordId]);
    $tenants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get properties for this landlord (using read replica)
    $stmt = $readConn->prepare("
        SELECT property_id, property_name
        FROM properties
        WHERE landlord_id = ?
        ORDER BY property_name
    ");
    $stmt->execute([$landlordId]);
    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get payment types from the enum definition
    $paymentTypes = [
        ['value' => 'full_month', 'label' => 'Full Month'],
        ['value' => 'fortnight_1', 'label' => 'First Fortnight'],
        ['value' => 'fortnight_2', 'label' => 'Second Fortnight'],
        ['value' => 'advance', 'label' => 'Advance Payment']
    ];

    echo json_encode([
        'success' => true,
        'data' => [
            'tenants' => $tenants,
            'properties' => $properties,
            'payment_types' => $paymentTypes
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>