<?php
include_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

$sessionToken = getBearerToken();

if (empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

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

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $required_fields = ['property_id', 'unit_number', 'monthly_rent'];
        foreach ($required_fields as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
                exit();
            }
        }

        // Verify property belongs to landlord
        $stmt = $conn->prepare("SELECT property_id FROM properties WHERE property_id = ? AND landlord_id = ?");
        $stmt->execute([$data['property_id'], $landlord_id]);
        if (!$stmt->fetch()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Property not found or access denied']);
            exit();
        }

        // Check if unit number already exists for this property
        $stmt = $conn->prepare("SELECT unit_id FROM property_units WHERE property_id = ? AND unit_number = ?");
        $stmt->execute([$data['property_id'], trim($data['unit_number'])]);
        if ($stmt->fetch()) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Unit number already exists for this property']);
            exit();
        }

        // Insert new unit
        $stmt = $conn->prepare("
            INSERT INTO property_units 
            (property_id, unit_number, block, level, room_number, unit_type, size_sqft, monthly_rent, status, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $result = $stmt->execute([
            $data['property_id'],
            trim($data['unit_number']),
            isset($data['block']) ? trim($data['block']) : null,
            isset($data['level']) ? trim($data['level']) : null,
            isset($data['room_number']) ? trim($data['room_number']) : null,
            isset($data['unit_type']) ? trim($data['unit_type']) : null,
            isset($data['size_sqft']) ? floatval($data['size_sqft']) : null,
            floatval($data['monthly_rent']),
            isset($data['status']) ? trim($data['status']) : 'available',
            isset($data['description']) ? trim($data['description']) : null
        ]);

        if ($result) {
            $unit_id = $conn->lastInsertId();
            echo json_encode([
                'success' => true,
                'message' => 'Unit added successfully',
                'data' => ['unit_id' => $unit_id]
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to add unit']);
        }
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>