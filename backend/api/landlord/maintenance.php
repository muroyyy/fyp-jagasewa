<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

    // Fetch all maintenance requests for this landlord's properties
    $stmt = $conn->prepare("
        SELECT 
            m.request_id,
            m.title,
            m.description,
            m.category,
            m.priority,
            m.status,
            m.preferred_date,
            m.estimated_completion,
            m.landlord_response,
            m.response_date,
            m.photos,
            m.created_at,
            m.updated_at,
            t.full_name as tenant_name,
            t.tenant_id,
            t.phone as tenant_phone,
            p.property_name,
            p.property_id
        FROM maintenance_requests m
        JOIN tenants t ON m.tenant_id = t.tenant_id
        JOIN properties p ON m.property_id = p.property_id
        WHERE p.landlord_id = ?
        ORDER BY 
            CASE m.priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
            END,
            CASE m.status
                WHEN 'pending' THEN 1
                WHEN 'in_progress' THEN 2
                WHEN 'completed' THEN 3
                WHEN 'cancelled' THEN 4
            END,
            m.created_at DESC
    ");
    $stmt->execute([$landlordId]);
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Parse photos JSON for each request
    foreach ($requests as &$request) {
        $request['photos'] = $request['photos'] ? json_decode($request['photos'], true) : [];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'requests' => $requests,
            'total_count' => count($requests)
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>