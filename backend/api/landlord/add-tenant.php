<?php
error_reporting(0);
ini_set('display_errors', 0);

require_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/email_helper.php';

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

    // Verify session token and check landlord role
    $stmt = $conn->prepare("
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

    // Get landlord_id
    $stmt = $conn->prepare("SELECT landlord_id, full_name FROM landlords WHERE user_id = ?");
    $stmt->execute([$auth['user_id']]);
    $landlord = $stmt->fetch(PDO::FETCH_ASSOC);
    $landlord_id = $landlord['landlord_id'];

    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields (only email, property_id, and unit_id for invitation)
    if (empty($data['email']) || empty($data['property_id']) || empty($data['unit_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email, property_id, and unit_id required']);
        exit();
    }

    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email format'
        ]);
        exit();
    }



    // Verify unit belongs to property and is available
    $stmt = $conn->prepare("SELECT unit_id, unit_number FROM property_units WHERE unit_id = ? AND property_id = ? AND status = 'available'");
    $stmt->execute([$data['unit_id'], $data['property_id']]);
    $unit = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$unit) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Unit not found or not available']);
        exit();
    }

    // Check if unit is already occupied
    $stmt = $conn->prepare("SELECT tenant_id FROM tenants WHERE unit_id = ? AND account_status = 'active'");
    $stmt->execute([$data['unit_id']]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Unit is already occupied']);
        exit();
    }

    // Get property details
    $stmt = $conn->prepare("SELECT property_name FROM properties WHERE property_id = ? AND landlord_id = ?");
    $stmt->execute([$data['property_id'], $landlord_id]);
    $property = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$property) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Property not found']);
        exit();
    }

    // Check if email already registered and if tenant is available for assignment
    $stmt = $conn->prepare("
        SELECT u.user_id, u.user_role, t.tenant_id, t.property_id 
        FROM users u 
        LEFT JOIN tenants t ON u.user_id = t.user_id 
        WHERE u.email = ?
    ");
    $stmt->execute([$data['email']]);
    $existingUser = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingUser) {
        // If user exists but is not a tenant, block registration
        if ($existingUser['user_role'] !== 'tenant') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email already registered with different role']);
            exit();
        }
        
        // If tenant exists and is already assigned to a property, block assignment
        if ($existingUser['property_id'] !== null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Tenant already assigned to another property']);
            exit();
        }
        
        // If tenant exists but has no property assigned, allow reassignment
        // Update the existing tenant record with new property and unit
        $stmt = $conn->prepare("
            UPDATE tenants 
            SET property_id = ?, unit_id = ?, move_in_date = CURDATE(), updated_at = NOW() 
            WHERE user_id = ?
        ");
        $stmt->execute([$data['property_id'], $data['unit_id'], $existingUser['user_id']]);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Existing tenant successfully assigned to property',
            'tenant_reassigned' => true
        ]);
        exit();
    }
    
    // Generate invitation token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    
    // Save invitation
    $stmt = $conn->prepare("
        INSERT INTO tenant_invitations (landlord_id, property_id, unit_id, tenant_email, invitation_token, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([$landlord_id, $data['property_id'], $data['unit_id'], $data['email'], $token, $expiresAt]);
    
    // Send invitation email
    $emailResult = sendTenantInvitation(
        $data['email'],
        $landlord['full_name'],
        $property['property_name'] . ' - Unit ' . $unit['unit_number'],
        $token
    );
    
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => $emailResult['email_sent'] ? 'Invitation sent successfully' : 'Invitation created',
        'email_sent' => $emailResult['email_sent'],
        'invitation_link' => $emailResult['invitation_link']
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>