<?php
include_once '../config/cors.php';
setCorsHeaders();


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Get Authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader)) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Authorization header missing'
    ]);
    exit();
}

// Extract token
$token = str_replace('Bearer ', '', $authHeader);

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Verify session token and get tenant info
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role, t.tenant_id, t.property_id
        FROM sessions s
        JOIN tenants t ON s.user_id = t.user_id
        WHERE s.session_token = :token 
        AND s.expires_at > NOW()
        AND s.user_role = 'tenant'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or expired session'
        ]);
        exit();
    }

    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $tenant_id = $session['tenant_id'];
    $property_id = $session['property_id'];

    // Check if tenant has a property assigned
    if (empty($property_id)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'You must be assigned to a property to submit maintenance requests'
        ]);
        exit();
    }

    // Get request data
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (empty($data['title']) || empty($data['description']) || empty($data['category'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Title, description, and category are required'
        ]);
        exit();
    }

    // Validate category
    $valid_categories = ['plumbing', 'electrical', 'appliances', 'hvac', 'carpentry', 'painting', 'pest_control', 'cleaning', 'other'];
    if (!in_array($data['category'], $valid_categories)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid category'
        ]);
        exit();
    }

    // Validate priority
    $valid_priorities = ['low', 'medium', 'high', 'urgent'];
    $priority = isset($data['priority']) ? $data['priority'] : 'medium';
    if (!in_array($priority, $valid_priorities)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid priority level'
        ]);
        exit();
    }

    // Insert maintenance request
    $stmt = $conn->prepare("
        INSERT INTO maintenance_requests (
            tenant_id,
            property_id,
            title,
            description,
            category,
            priority,
            status,
            preferred_date,
            created_at,
            updated_at
        ) VALUES (
            :tenant_id,
            :property_id,
            :title,
            :description,
            :category,
            :priority,
            'pending',
            :preferred_date,
            NOW(),
            NOW()
        )
    ");

    $stmt->bindParam(':tenant_id', $tenant_id);
    $stmt->bindParam(':property_id', $property_id);
    $stmt->bindParam(':title', $data['title']);
    $stmt->bindParam(':description', $data['description']);
    $stmt->bindParam(':category', $data['category']);
    $stmt->bindParam(':priority', $priority);
    $preferred_date = !empty($data['preferred_date']) ? $data['preferred_date'] : null;
    $stmt->bindParam(':preferred_date', $preferred_date);

    if ($stmt->execute()) {
        $request_id = $conn->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Maintenance request submitted successfully',
            'data' => [
                'request_id' => $request_id
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to submit maintenance request'
        ]);
    }

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