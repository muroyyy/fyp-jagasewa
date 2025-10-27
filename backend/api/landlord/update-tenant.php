<?php
include_once '../../config/cors.php';
setCorsHeaders();

// backend/api/landlord/update-tenant.php


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

try {
    // Get database connection (PDO)
    $database = new Database();
    $conn = $database->getConnection();

    // Check authentication
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Unauthorized. No token provided.'
        ]);
        exit();
    }

    $token = $matches[1];

    // Verify session token
    $query = "SELECT s.user_id, s.user_role 
              FROM sessions s 
              WHERE s.session_token = :token 
              AND s.expires_at > NOW()";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or expired session.'
        ]);
        exit();
    }

    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    // Check if user is a landlord
    if ($session['user_role'] !== 'landlord') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Access denied. Landlords only.'
        ]);
        exit();
    }

    // Get landlord_id
    $query = "SELECT landlord_id FROM landlords WHERE user_id = :user_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $session['user_id']);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Landlord profile not found.'
        ]);
        exit();
    }

    $landlord = $stmt->fetch(PDO::FETCH_ASSOC);
    $landlord_id = $landlord['landlord_id'];

    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    if (empty($data['tenant_id']) || empty($data['full_name']) || empty($data['phone']) || 
        empty($data['ic_number']) || empty($data['date_of_birth']) || empty($data['property_id']) || 
        empty($data['move_in_date'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'All fields are required.'
        ]);
        exit();
    }

    $tenant_id = $data['tenant_id'];
    $full_name = trim($data['full_name']);
    $phone = trim($data['phone']);
    $ic_number = trim($data['ic_number']);
    $date_of_birth = $data['date_of_birth'];
    $property_id = $data['property_id'];
    $move_in_date = $data['move_in_date'];

    // Verify tenant belongs to landlord's property
    $query = "SELECT t.tenant_id 
              FROM tenants t
              INNER JOIN properties p ON t.property_id = p.property_id
              WHERE t.tenant_id = :tenant_id 
              AND p.landlord_id = :landlord_id";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':tenant_id', $tenant_id, PDO::PARAM_INT);
    $stmt->bindParam(':landlord_id', $landlord_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Tenant not found or does not belong to your properties.'
        ]);
        exit();
    }

    // Verify new property belongs to landlord
    $query = "SELECT property_id FROM properties WHERE property_id = :property_id AND landlord_id = :landlord_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':property_id', $property_id, PDO::PARAM_INT);
    $stmt->bindParam(':landlord_id', $landlord_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid property selected.'
        ]);
        exit();
    }

    // Update tenant information
    $query = "UPDATE tenants 
              SET full_name = :full_name,
                  phone = :phone,
                  ic_number = :ic_number,
                  date_of_birth = :date_of_birth,
                  property_id = :property_id,
                  move_in_date = :move_in_date,
                  updated_at = NOW()
              WHERE tenant_id = :tenant_id";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':full_name', $full_name);
    $stmt->bindParam(':phone', $phone);
    $stmt->bindParam(':ic_number', $ic_number);
    $stmt->bindParam(':date_of_birth', $date_of_birth);
    $stmt->bindParam(':property_id', $property_id, PDO::PARAM_INT);
    $stmt->bindParam(':move_in_date', $move_in_date);
    $stmt->bindParam(':tenant_id', $tenant_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Tenant updated successfully.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update tenant.'
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