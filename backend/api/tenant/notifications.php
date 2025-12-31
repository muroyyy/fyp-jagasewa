<?php
include_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/tenant_cache.php';

try {
    // Check authentication
    $user = authenticate();
    
    if (!$user || $user['role'] !== 'tenant') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }
    
    $database = new Database();
    $conn = $database->getConnection();

    // Get tenant info
    $stmt = $conn->prepare("SELECT tenant_id, property_id FROM tenants WHERE user_id = ?");
    $stmt->execute([$user['user_id']]);
    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tenant) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tenant not found']);
        exit();
    }

    $tenantId = $tenant['tenant_id'];
    $propertyId = $tenant['property_id'];

    // Simple notification response for now
    echo json_encode([
        'success' => true,
        'data' => [
            'notifications' => [],
            'unread_count' => 0,
            'total_count' => 0
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error'
    ]);
}
?>