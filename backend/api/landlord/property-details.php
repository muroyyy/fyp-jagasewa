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
        echo json_encode(['success' => false, 'message' => 'Access denied', 'debug' => $user_data]);
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
        echo json_encode(['success' => false, 'message' => 'Landlord profile not found', 'user_id' => $user_data['user_id']]);
        exit();
    }
    
    $landlord_id = $landlord_data['landlord_id'];

    // Get property ID from query parameter
    $property_id = $_GET['property_id'] ?? null;
    if (!$property_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Property ID required']);
        exit();
    }

    // Get property details with tenant count
    $query = "SELECT p.*, 
                     COUNT(DISTINCT t.tenant_id) as total_tenants
              FROM properties p 
              LEFT JOIN tenants t ON p.property_id = t.property_id 
              WHERE p.property_id = :property_id AND p.landlord_id = :landlord_id
              GROUP BY p.property_id";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':property_id', $property_id, PDO::PARAM_INT);
    $stmt->bindParam(':landlord_id', $landlord_id, PDO::PARAM_INT);
    $stmt->execute();

    $property = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$property) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Property not found']);
        exit();
    }

    // Get recent tenants for this property (since no applications table exists)
    $tenant_query = "SELECT t.*, u.email 
                     FROM tenants t 
                     JOIN users u ON t.user_id = u.user_id 
                     WHERE t.property_id = :property_id 
                     ORDER BY t.created_at DESC 
                     LIMIT 5";
    
    $tenant_stmt = $conn->prepare($tenant_query);
    $tenant_stmt->bindParam(':property_id', $property_id, PDO::PARAM_INT);
    $tenant_stmt->execute();
    $recent_tenants = $tenant_stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode images JSON if present
    if (!empty($property['images'])) {
        $property['images'] = json_decode($property['images'], true);
    } else {
        $property['images'] = [];
    }
    
    // Debug output
    $response = [
        'success' => true,
        'data' => [
            'property' => $property,
            'recent_tenants' => $recent_tenants
        ],
        'debug' => [
            'property_id' => $property_id,
            'landlord_id' => $landlord_id,
            'user_id' => $user_data['user_id'],
            'property_count' => $property ? 1 : 0,
            'tenant_count' => count($recent_tenants)
        ]
    ];
    
    echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>