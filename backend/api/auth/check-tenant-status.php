<?php
require_once '../config/cors.php';
setCorsHeaders();

require_once '../config/database.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email = $input['email'] ?? '';

    if (empty($email)) {
        echo json_encode([
            'success' => false,
            'is_tenant' => false,
            'message' => 'Email is required'
        ]);
        exit;
    }

    $database = new Database();
    $db = $database->getConnection();

    // Check if user exists and is a tenant
    $query = "SELECT u.user_id, u.user_role, t.tenant_id, t.property_id 
              FROM users u 
              LEFT JOIN tenants t ON u.user_id = t.user_id 
              WHERE u.email = ? LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode([
            'success' => true,
            'is_tenant' => false,
            'message' => 'User not found'
        ]);
        exit;
    }

    if ($user['user_role'] === 'tenant' && $user['property_id']) {
        echo json_encode([
            'success' => true,
            'is_tenant' => true,
            'has_property' => true,
            'message' => 'User is already a tenant with an assigned property'
        ]);
    } else if ($user['user_role'] === 'tenant') {
        echo json_encode([
            'success' => true,
            'is_tenant' => true,
            'has_property' => false,
            'message' => 'User is a tenant but no property assigned yet'
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'is_tenant' => false,
            'message' => 'User exists but is not a tenant'
        ]);
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'is_tenant' => false,
        'message' => $e->getMessage()
    ]);
}
?>