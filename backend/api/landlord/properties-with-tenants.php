<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

try {
    $database = new Database();
    $db = $database->getConnection();           // Primary for session verification
    $readDb = $database->getReadConnection();   // Replica for read-only queries

    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $stmt = $db->prepare("SELECT s.user_id FROM sessions s WHERE s.session_token = :token AND s.expires_at > NOW() AND s.user_role = 'landlord'");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }

    // Get landlord_id (using read replica)
    $landlordStmt = $readDb->prepare("SELECT landlord_id FROM landlords WHERE user_id = :user_id");
    $landlordStmt->bindParam(':user_id', $session['user_id']);
    $landlordStmt->execute();
    $landlord = $landlordStmt->fetch(PDO::FETCH_ASSOC);

    if (!$landlord) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Landlord profile not found']);
        exit();
    }

    // Get properties with tenants (using read replica)
    $query = "SELECT
                p.property_id,
                p.property_name,
                p.address,
                p.city,
                p.state,
                p.property_type,
                p.total_units,
                p.monthly_rent,
                p.main_image,
                p.images,
                COUNT(DISTINCT pu.unit_id) as total_units_created,
                COUNT(DISTINCT t.tenant_id) as tenant_count,
                COALESCE(SUM(CASE WHEN t.account_status = 'active' THEN 1 ELSE 0 END), 0) as active_tenants,
                COALESCE(SUM(CASE WHEN t.account_status = 'pending' THEN 1 ELSE 0 END), 0) as pending_tenants,
                COALESCE(COUNT(DISTINCT CASE WHEN pu.status = 'available' THEN pu.unit_id END), 0) as available_units,
                COALESCE(COUNT(DISTINCT CASE WHEN pu.status = 'occupied' THEN pu.unit_id END), 0) as occupied_units
              FROM properties p
              LEFT JOIN property_units pu ON p.property_id = pu.property_id
              LEFT JOIN tenants t ON pu.unit_id = t.unit_id
              WHERE p.landlord_id = :landlord_id
              GROUP BY p.property_id, p.property_name, p.address, p.city, p.state, p.property_type, p.total_units, p.monthly_rent, p.main_image, p.images
              ORDER BY p.property_name";

    $stmt = $readDb->prepare($query);
    $stmt->bindParam(':landlord_id', $landlord['landlord_id']);
    $stmt->execute();

    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => ['properties' => $properties]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
