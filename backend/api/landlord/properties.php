<?php
include_once '../../config/cors.php';
setCorsHeaders();


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
    $conn = $database->getConnection();

    // Verify session and get landlord_id
    $stmt = $conn->prepare("
        SELECT l.landlord_id
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

    $landlord_id = $session['landlord_id'];

    // Get all properties for this landlord
    $stmt = $conn->prepare("
        SELECT 
            property_id,
            landlord_id,
            property_name,
            property_type,
            address,
            city,
            state,
            postal_code,
            country,
            total_units,
            description,
            monthly_rent,
            status,
            images,
            created_at,
            updated_at
        FROM properties
        WHERE landlord_id = ?
        ORDER BY created_at DESC
    ");
    $stmt->execute([$landlord_id]);
    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decode images JSON for each property
    foreach ($properties as &$property) {
        if (!empty($property['images'])) {
            $property['images'] = json_decode($property['images'], true);
        } else {
            $property['images'] = [];
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'properties' => $properties,
            'total' => count($properties)
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