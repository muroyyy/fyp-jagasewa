<?php
include_once '../../../config/cors.php';
setCorsHeaders();

// backend/api/landlord/property-details.php


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';

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

    // Get property_id from query parameter
    $property_id = isset($_GET['property_id']) ? intval($_GET['property_id']) : 0;

    if ($property_id === 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Property ID is required.'
        ]);
        exit();
    }

    // Fetch property details
    $query = "SELECT 
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
              WHERE property_id = :property_id 
              AND landlord_id = :landlord_id";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':property_id', $property_id, PDO::PARAM_INT);
    $stmt->bindParam(':landlord_id', $landlord_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Property not found or does not belong to you.'
        ]);
        exit();
    }

    $property = $stmt->fetch(PDO::FETCH_ASSOC);

    // Convert numeric values to proper types
    $property['property_id'] = (int)$property['property_id'];
    $property['landlord_id'] = (int)$property['landlord_id'];
    $property['total_units'] = (int)$property['total_units'];
    $property['monthly_rent'] = (float)$property['monthly_rent'];

    // Decode images JSON
    if (!empty($property['images'])) {
        $property['images'] = json_decode($property['images'], true);
    } else {
        $property['images'] = [];
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Property details retrieved successfully.',
        'data' => $property
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