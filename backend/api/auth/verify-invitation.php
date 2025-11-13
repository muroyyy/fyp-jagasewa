<?php
error_reporting(0);
ini_set('display_errors', 0);

require_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';

$database = new Database();
$pdo = $database->getConnection();

$token = $_GET['token'] ?? '';

if (empty($token)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Token required']);
    exit();
}

try {
    $stmt = $pdo->prepare("
        SELECT ti.*, p.property_name, l.full_name as landlord_name
        FROM tenant_invitations ti
        JOIN properties p ON ti.property_id = p.property_id
        JOIN landlords l ON ti.landlord_id = l.landlord_id
        WHERE ti.invitation_token = ? AND ti.status = 'pending' AND ti.expires_at > NOW()
    ");
    $stmt->execute([$token]);
    $invitation = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$invitation) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired invitation']);
        exit();
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'tenant_email' => $invitation['tenant_email'],
            'property_name' => $invitation['property_name'],
            'landlord_name' => $invitation['landlord_name'],
            'property_id' => $invitation['property_id']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
