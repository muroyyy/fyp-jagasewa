<?php
require_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
include_once '../../models/User.php';
include_once '../../models/Tenant.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if (empty($data->token) || empty($data->password) || empty($data->full_name) || 
    empty($data->phone) || empty($data->ic_number) || empty($data->date_of_birth)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All fields required']);
    exit();
}

try {
    $db->beginTransaction();
    
    // Verify invitation
    $stmt = $db->prepare("
        SELECT * FROM tenant_invitations 
        WHERE invitation_token = ? AND status = 'pending' AND expires_at > NOW()
    ");
    $stmt->execute([$data->token]);
    $invitation = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$invitation) {
        $db->rollBack();
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired invitation']);
        exit();
    }
    
    // Create user
    $user = new User($db);
    $user->email = $invitation['tenant_email'];
    $user->password_hash = $data->password;
    $user->user_role = 'tenant';
    $user->is_verified = 1; // Auto-verify invited tenants
    
    if (!$user->register()) {
        $db->rollBack();
        http_response_code(503);
        echo json_encode(['success' => false, 'message' => 'Failed to create user']);
        exit();
    }
    
    // Create tenant profile
    $tenant = new Tenant($db);
    $tenant->user_id = $user->user_id;
    $tenant->property_id = $invitation['property_id'];
    $tenant->full_name = $data->full_name;
    $tenant->phone = $data->phone;
    $tenant->ic_number = $data->ic_number;
    $tenant->date_of_birth = $data->date_of_birth;
    $tenant->move_in_date = date('Y-m-d');
    
    if (!$tenant->create()) {
        $db->rollBack();
        http_response_code(503);
        echo json_encode(['success' => false, 'message' => 'Failed to create tenant profile']);
        exit();
    }
    
    // Mark invitation as accepted
    $stmt = $db->prepare("
        UPDATE tenant_invitations 
        SET status = 'accepted', accepted_at = NOW() 
        WHERE invitation_id = ?
    ");
    $stmt->execute([$invitation['invitation_id']]);
    
    $db->commit();
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registration completed successfully',
        'data' => [
            'user_id' => $user->user_id,
            'tenant_id' => $tenant->tenant_id,
            'email' => $user->email
        ]
    ]);
    
} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
