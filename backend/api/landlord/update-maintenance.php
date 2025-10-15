<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

// Get authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$sessionToken = $matches[1];

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['request_id']) || !isset($data['status']) || !isset($data['response'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit();
}

$requestId = $data['request_id'];
$status = $data['status'];
$response = $data['response'];
$estimatedCompletion = isset($data['estimated_completion']) && !empty($data['estimated_completion']) 
    ? $data['estimated_completion'] 
    : null;

try {
    $database = new Database();
    $conn = $database->connect();

    // Verify session and get landlord_id
    $stmt = $conn->prepare("
        SELECT s.user_id, u.user_role, l.landlord_id 
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        JOIN landlords l ON u.user_id = l.user_id
        WHERE s.session_token = ? AND s.expires_at > NOW() AND u.user_role = 'landlord'
    ");
    $stmt->execute([$sessionToken]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit();
    }

    $landlordId = $session['landlord_id'];

    // Verify this request belongs to landlord's property
    $stmt = $conn->prepare("
        SELECT m.request_id
        FROM maintenance_requests m
        JOIN properties p ON m.property_id = p.property_id
        WHERE m.request_id = ? AND p.landlord_id = ?
    ");
    $stmt->execute([$requestId, $landlordId]);
    
    if (!$stmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Not authorized to update this request']);
        exit();
    }

    // Update the maintenance request
    $stmt = $conn->prepare("
        UPDATE maintenance_requests 
        SET 
            status = ?,
            landlord_response = ?,
            response_date = NOW(),
            estimated_completion = ?,
            updated_at = NOW()
        WHERE request_id = ?
    ");
    
    $stmt->execute([$status, $response, $estimatedCompletion, $requestId]);

    echo json_encode([
        'success' => true,
        'message' => 'Request updated successfully'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>