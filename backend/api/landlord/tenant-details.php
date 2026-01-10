<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

try {
    $database = new Database();
    $conn = $database->getConnection();           // Primary for session verification
    $readConn = $database->getReadConnection();   // Replica for read-only queries

    // Check authentication
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Verify session token and check landlord role
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role
        FROM sessions s
        WHERE s.session_token = :token AND s.expires_at > NOW() AND s.user_role = 'landlord'
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

    // Get landlord_id from landlords table (using read replica)
    $landlord_query = "SELECT landlord_id FROM landlords WHERE user_id = :user_id";
    $landlord_stmt = $readConn->prepare($landlord_query);
    $landlord_stmt->bindParam(':user_id', $user_data['user_id'], PDO::PARAM_INT);
    $landlord_stmt->execute();
    $landlord_data = $landlord_stmt->fetch(PDO::FETCH_ASSOC);

    if (!$landlord_data) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Landlord profile not found']);
        exit();
    }

    $landlord_id = $landlord_data['landlord_id'];

    // Get tenant ID from query parameter
    $tenant_id = $_GET['tenant_id'] ?? null;
    if (!$tenant_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tenant ID required']);
        exit();
    }

    // Get tenant details with current property (using read replica)
    $query = "SELECT u.user_id, u.email, u.is_active, u.is_verified, u.created_at,
                     t.full_name, t.phone, t.ic_number, t.date_of_birth,
                     t.property_id, t.move_in_date, p.property_name, p.property_type, p.address, p.monthly_rent
              FROM tenants t
              JOIN users u ON t.user_id = u.user_id
              LEFT JOIN properties p ON t.property_id = p.property_id
              WHERE t.tenant_id = :tenant_id AND u.user_role = 'tenant'";

    $stmt = $readConn->prepare($query);
    $stmt->bindParam(':tenant_id', $tenant_id, PDO::PARAM_INT);
    $stmt->execute();

    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tenant) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tenant not found']);
        exit();
    }

    // Get rental history for this tenant with landlord's properties (using read replica)
    $history_query = "SELECT t.*, p.property_name, p.address, p.monthly_rent, t.move_in_date, t.created_at
                      FROM tenants t
                      JOIN properties p ON t.property_id = p.property_id
                      WHERE t.tenant_id = :tenant_id AND p.landlord_id = :landlord_id
                      ORDER BY t.created_at DESC";

    $history_stmt = $readConn->prepare($history_query);
    $history_stmt->bindParam(':tenant_id', $tenant_id, PDO::PARAM_INT);
    $history_stmt->bindParam(':landlord_id', $landlord_id, PDO::PARAM_INT);
    $history_stmt->execute();
    $rental_history = $history_stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => [
            'tenant' => $tenant,
            'rental_history' => $rental_history
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>