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

    // Validate required fields (only email and property_id for invitation)
    if (empty($data['email']) || empty($data['property_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email and property_id required']);
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



    // Get property details
    $stmt = $conn->prepare("SELECT property_name FROM properties WHERE property_id = ? AND landlord_id = ?");
    $stmt->execute([$data['property_id'], $landlord_id]);
    $property = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$property) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Property not found']);
        exit();
    }

    // Check if email already registered
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        exit();
    }
    
    // Generate invitation token
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    
    // Save invitation
    $stmt = $conn->prepare("
        INSERT INTO tenant_invitations (landlord_id, property_id, tenant_email, invitation_token, expires_at)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$landlord_id, $data['property_id'], $data['email'], $token, $expiresAt]);
    
    // Send invitation email
    $emailResult = sendTenantInvitation(
        $data['email'],
        $landlord['full_name'],
        $property['property_name'],
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