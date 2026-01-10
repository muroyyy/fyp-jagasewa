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

    $propertyId = $_GET['property_id'] ?? null;
    if (!$propertyId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Property ID required']);
        exit();
    }

    // Verify property belongs to landlord (using read replica)
    $verifyStmt = $readDb->prepare("SELECT property_name FROM properties WHERE property_id = :property_id AND landlord_id = :landlord_id");
    $verifyStmt->bindParam(':property_id', $propertyId);
    $verifyStmt->bindParam(':landlord_id', $landlord['landlord_id']);
    $verifyStmt->execute();
    $property = $verifyStmt->fetch(PDO::FETCH_ASSOC);

    if (!$property) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Property not found or access denied']);
        exit();
    }

    // Get tenants (using read replica)
    $query = "SELECT
                t.tenant_id,
                t.user_id,
                t.full_name,
                u.email,
                t.phone,
                t.move_in_date,
                t.move_out_date,
                t.account_status
              FROM tenants t
              INNER JOIN users u ON t.user_id = u.user_id
              WHERE t.property_id = :property_id
              ORDER BY t.move_in_date DESC";

    $stmt = $readDb->prepare($query);
    $stmt->bindParam(':property_id', $propertyId);
    $stmt->execute();

    $tenants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'property_name' => $property['property_name'],
            'tenants' => $tenants
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
