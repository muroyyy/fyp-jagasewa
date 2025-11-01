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

    // Get property ID from query parameter
    $property_id = $_GET['property_id'] ?? null;
    if (!$property_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Property ID required']);
        exit();
    }

    // Get property details with optimized query
    $query = "SELECT p.*, 
                     COUNT(DISTINCT a.application_id) as total_applications,
                     COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.application_id END) as pending_applications,
                     COUNT(DISTINCT CASE WHEN a.status = 'approved' THEN a.application_id END) as approved_applications
              FROM properties p 
              LEFT JOIN applications a ON p.property_id = a.property_id 
              WHERE p.property_id = :property_id AND p.landlord_id = :landlord_id
              GROUP BY p.property_id";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':property_id', $property_id, PDO::PARAM_INT);
    $stmt->bindParam(':landlord_id', $user_data['user_id'], PDO::PARAM_INT);
    $stmt->execute();

    $property = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$property) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Property not found']);
        exit();
    }

    // Get recent applications for this property
    $app_query = "SELECT a.*, u.full_name, u.email, u.phone 
                  FROM applications a 
                  JOIN users u ON a.tenant_id = u.user_id 
                  WHERE a.property_id = :property_id 
                  ORDER BY a.application_date DESC 
                  LIMIT 5";
    
    $app_stmt = $conn->prepare($app_query);
    $app_stmt->bindParam(':property_id', $property_id, PDO::PARAM_INT);
    $app_stmt->execute();
    $recent_applications = $app_stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'property' => $property,
        'recent_applications' => $recent_applications
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>