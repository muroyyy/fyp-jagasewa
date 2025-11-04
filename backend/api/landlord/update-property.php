<?php
header("Access-Control-Allow-Origin: https://jagasewa.cloud");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

// Only allow PUT requests
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);
    exit();
}

// Get authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader)) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "No authorization token provided"
    ]);
    exit();
}

// Extract token from "Bearer <token>"
$token = str_replace('Bearer ', '', $authHeader);

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify token and get user from sessions table
    $query = "SELECT user_id, user_role FROM sessions WHERE session_token = :token AND expires_at > NOW()";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session || $session['user_role'] !== 'landlord') {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Unauthorized access"
        ]);
        exit();
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['property_id'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Property ID is required"
        ]);
        exit();
    }
    
    $propertyId = $input['property_id'];
    $userId = $session['user_id'];
    
    // Build update query dynamically
    $updateFields = [];
    $params = [':property_id' => $propertyId, ':user_id' => $userId];
    
    $allowedFields = ['title', 'description', 'price', 'location', 'bedrooms', 'bathrooms', 'property_type', 'status'];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updateFields[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }
    
    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "No valid fields to update"
        ]);
        exit();
    }
    
    // Update property (ensure landlord owns the property)
    $updateQuery = "UPDATE properties SET " . implode(', ', $updateFields) . 
                   " WHERE id = :property_id AND landlord_id = (SELECT id FROM landlords WHERE user_id = :user_id)";
    
    $stmt = $db->prepare($updateQuery);
    $result = $stmt->execute($params);
    
    if ($result && $stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Property updated successfully"
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Property not found or no changes made"
        ]);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>