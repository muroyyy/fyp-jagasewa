<?php
error_reporting(0);
ini_set('display_errors', 0);

require_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/email_helper.php';

$database = new Database();
$pdo = $database->getConnection();

$auth = authenticate();
if (!$auth || $auth['role'] !== 'landlord') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (empty($data->tenant_email) || empty($data->property_id)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and property_id required']);
    exit();
}

try {
    // Get landlord_id
    $stmt = $pdo->prepare("SELECT landlord_id, full_name FROM landlords WHERE user_id = ?");
    $stmt->execute([$auth['user_id']]);
    $landlord = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Get property name
    $stmt = $pdo->prepare("SELECT property_name FROM properties WHERE property_id = ? AND landlord_id = ?");
    $stmt->execute([$data->property_id, $landlord['landlord_id']]);
    $property = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$property) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Property not found']);
        exit();
    }
    
    // Check if email already registered
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->execute([$data->tenant_email]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        exit();
    }
    
    // Generate token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    
    // Save invitation
    $stmt = $pdo->prepare("
        INSERT INTO tenant_invitations (landlord_id, property_id, tenant_email, invitation_token, expires_at)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$landlord['landlord_id'], $data->property_id, $data->tenant_email, $token, $expiresAt]);
    
    // Send email
    $emailResult = sendTenantInvitation(
        $data->tenant_email,
        $landlord['full_name'],
        $property['property_name'],
        $token
    );
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $emailResult['email_sent'] ? 'Invitation sent successfully' : 'Invitation created (email delivery pending)',
        'email_sent' => $emailResult['email_sent'],
        'invitation_link' => $emailResult['invitation_link']
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
