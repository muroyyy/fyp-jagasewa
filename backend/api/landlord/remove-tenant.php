<?php
error_reporting(0);
ini_set('display_errors', 0);

require_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

$database = new Database();
$pdo = $database->getConnection();

$token = getBearerToken();
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$stmt = $pdo->prepare("
    SELECT s.user_id, s.user_role 
    FROM sessions s 
    WHERE s.session_token = :token AND s.expires_at > NOW() AND s.user_role = 'landlord'
");
$stmt->bindParam(':token', $token);
$stmt->execute();
$session = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$session) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Access denied']);
    exit();
}

$auth = ['user_id' => $session['user_id'], 'role' => $session['user_role']];

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
