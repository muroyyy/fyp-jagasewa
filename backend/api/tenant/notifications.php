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
    // Use old authentication method temporarily
    $sessionToken = getBearerToken();

    if (empty($sessionToken)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $database = new Database();
    $conn = $database->getConnection();

    // Verify session and get tenant_id
    $stmt = $conn->prepare("
        SELECT s.user_id, u.user_role, t.tenant_id, t.property_id
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        JOIN tenants t ON u.user_id = t.user_id
        WHERE s.session_token = ? AND s.expires_at > NOW() AND u.user_role = 'tenant'
    ");
    $stmt->execute([$sessionToken]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit();
    }

    $tenantId = $session['tenant_id'];
    $propertyId = $session['property_id'];

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