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

    // Verify token and get user info
    $user_data = verifyJWT($token);
    if (!$user_data || $user_data['role'] !== 'landlord') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    // Get landlord_id from landlords table
    $landlord_query = "SELECT landlord_id FROM landlords WHERE user_id = :user_id";
    $landlord_stmt = $conn->prepare($landlord_query);
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

    // Get tenant details with rental history
    $query = "SELECT u.user_id, u.email, u.created_at, t.full_name, t.phone, t.ic_number, t.date_of_birth,
                     COUNT(DISTINCT t2.tenant_id) as total_rentals,
                     COUNT(DISTINCT p.property_id) as properties_rented
              FROM tenants t
              JOIN users u ON t.user_id = u.user_id
              LEFT JOIN tenants t2 ON u.user_id = t2.user_id 
              LEFT JOIN properties p ON t2.property_id = p.property_id AND p.landlord_id = :landlord_id
              WHERE t.tenant_id = :tenant_id AND u.user_role = 'tenant'
              GROUP BY u.user_id";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':tenant_id', $tenant_id, PDO::PARAM_INT);
    $stmt->bindParam(':landlord_id', $landlord_id, PDO::PARAM_INT);
    $stmt->execute();

    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tenant) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tenant not found']);
        exit();
    }

    // Get rental history for this tenant with landlord's properties
    $history_query = "SELECT t.*, p.property_name, p.address, p.monthly_rent, t.move_in_date, t.created_at
                      FROM tenants t 
                      JOIN properties p ON t.property_id = p.property_id 
                      WHERE t.tenant_id = :tenant_id AND p.landlord_id = :landlord_id
                      ORDER BY t.created_at DESC";
    
    $history_stmt = $conn->prepare($history_query);
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