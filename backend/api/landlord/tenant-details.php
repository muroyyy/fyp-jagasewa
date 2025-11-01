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

    // Get tenant ID from query parameter
    $tenant_id = $_GET['tenant_id'] ?? null;
    if (!$tenant_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Tenant ID required']);
        exit();
    }

    // Get tenant details with rental history
    $query = "SELECT u.user_id, u.full_name, u.email, u.phone, u.created_at,
                     COUNT(DISTINCT a.application_id) as total_applications,
                     COUNT(DISTINCT CASE WHEN a.status = 'approved' THEN a.application_id END) as approved_applications,
                     COUNT(DISTINCT p.property_id) as properties_rented
              FROM users u 
              LEFT JOIN applications a ON u.user_id = a.tenant_id 
              LEFT JOIN properties p ON a.property_id = p.property_id AND p.landlord_id = :landlord_id
              WHERE u.user_id = :tenant_id AND u.role = 'tenant'
              GROUP BY u.user_id";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':tenant_id', $tenant_id, PDO::PARAM_INT);
    $stmt->bindParam(':landlord_id', $user_data['user_id'], PDO::PARAM_INT);
    $stmt->execute();

    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tenant) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tenant not found']);
        exit();
    }

    // Get rental history for this tenant with landlord's properties
    $history_query = "SELECT a.*, p.title, p.location, p.rent_amount, a.application_date, a.status
                      FROM applications a 
                      JOIN properties p ON a.property_id = p.property_id 
                      WHERE a.tenant_id = :tenant_id AND p.landlord_id = :landlord_id
                      ORDER BY a.application_date DESC";
    
    $history_stmt = $conn->prepare($history_query);
    $history_stmt->bindParam(':tenant_id', $tenant_id, PDO::PARAM_INT);
    $history_stmt->bindParam(':landlord_id', $user_data['user_id'], PDO::PARAM_INT);
    $history_stmt->execute();
    $rental_history = $history_stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'tenant' => $tenant,
        'rental_history' => $rental_history
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>