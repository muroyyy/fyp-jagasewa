<?php
header("Access-Control-Allow-Origin: https://jagasewa.cloud");
header("Access-Control-Allow-Methods: POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

// Allow POST and PUT requests
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT'])) {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);
    exit();
}

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check authentication
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Verify token and check landlord role
    $user_data = verifyJWT($token);
    if (!$user_data || $user_data['role'] !== 'landlord') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    // Handle both JSON and FormData input
    if ($_SERVER['CONTENT_TYPE'] && strpos($_SERVER['CONTENT_TYPE'], 'multipart/form-data') !== false) {
        $input = $_POST;
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
    }
    
    if (!$input || !isset($input['property_id'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Property ID is required"
        ]);
        exit();
    }
    
    $propertyId = $input['property_id'];
    $userId = $user_data['user_id'];
    
    // Build update query dynamically
    $updateFields = [];
    $params = [':property_id' => $propertyId, ':user_id' => $userId];
    
    $allowedFields = ['property_name', 'description', 'monthly_rent', 'address', 'city', 'state', 'postal_code', 'total_units', 'property_type', 'status'];
    
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
                   " WHERE property_id = :property_id AND landlord_id = (SELECT landlord_id FROM landlords WHERE user_id = :user_id)";
    
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