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
        SELECT l.landlord_id
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

    $landlord_id = $session['landlord_id'];

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $property_id = $_GET['property_id'] ?? null;
        
        if (!$property_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Property ID is required']);
            exit();
        }

        // Verify property belongs to landlord
        $stmt = $conn->prepare("SELECT property_id FROM properties WHERE property_id = ? AND landlord_id = ?");
        $stmt->execute([$property_id, $landlord_id]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Property not found or access denied']);
            exit();
        }

        // Get units with tenant information
        $stmt = $conn->prepare("
            SELECT 
                pu.*,
                t.tenant_id,
                t.full_name as tenant_name,
                t.phone as tenant_phone,
                t.move_in_date,
                t.account_status as tenant_status
            FROM property_units pu
            LEFT JOIN tenants t ON pu.unit_id = t.unit_id AND t.account_status = 'active'
            WHERE pu.property_id = ?
            ORDER BY pu.unit_number
        ");
        $stmt->execute([$property_id]);
        $units = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => ['units' => $units]
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>