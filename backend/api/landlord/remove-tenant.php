<?php
error_reporting(0);
ini_set('display_errors', 0);

require_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

$database = new Database();
$pdo = $database->getConnection();

$auth = authenticate();
if (!$auth['success'] || $auth['user_role'] !== 'landlord') {
    http_response_code(403);
    echo json_encode([
        'success' => false, 
        'message' => 'Unauthorized',
        'debug' => [
            'auth_success' => $auth['success'] ?? false,
            'user_role' => $auth['user_role'] ?? 'none',
            'expected_role' => 'landlord'
        ]
    ]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->tenant_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tenant ID required']);
    exit();
}

try {
    // Get landlord_id
    $stmt = $pdo->prepare("SELECT landlord_id FROM landlords WHERE user_id = ?");
    $stmt->execute([$auth['user_id']]);
    $landlord = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$landlord) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Landlord not found']);
        exit();
    }
    
    // Verify tenant belongs to landlord's property
    $stmt = $pdo->prepare("
        SELECT t.user_id, t.property_id 
        FROM tenants t
        JOIN properties p ON t.property_id = p.property_id
        WHERE t.tenant_id = ? AND p.landlord_id = ?
    ");
    $stmt->execute([$data->tenant_id, $landlord['landlord_id']]);
    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tenant) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tenant not found']);
        exit();
    }
    
    $pdo->beginTransaction();
    
    // Delete related records first (if not using CASCADE)
    $stmt = $pdo->prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?");
    $stmt->execute([$tenant['user_id'], $tenant['user_id']]);
    
    $stmt = $pdo->prepare("DELETE FROM sessions WHERE user_id = ?");
    $stmt->execute([$tenant['user_id']]);
    
    // Delete tenant record
    $stmt = $pdo->prepare("DELETE FROM tenants WHERE tenant_id = ?");
    $stmt->execute([$data->tenant_id]);
    
    // Delete user account
    $stmt = $pdo->prepare("DELETE FROM users WHERE user_id = ?");
    $stmt->execute([$tenant['user_id']]);
    
    $pdo->commit();
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Tenant removed successfully']);
    
} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
