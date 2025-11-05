<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
    $updateParams = [':property_id' => $propertyId];
    
    $allowedFields = ['property_name', 'description', 'monthly_rent', 'address', 'city', 'state', 'postal_code', 'total_units', 'property_type', 'status'];
    
    foreach ($allowedFields as $field) {
        if (isset($input[$field])) {
            $updateFields[] = "$field = :$field";
            $updateParams[":$field"] = $input[$field];
        }
    }
    
    // Handle image upload
    if (isset($_FILES['property_images']) && !empty($_FILES['property_images']['name'][0])) {
        $uploadDir = '../../uploads/properties/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Handle multiple files
        $uploadedImages = [];
        for ($i = 0; $i < count($_FILES['property_images']['name']); $i++) {
            if ($_FILES['property_images']['error'][$i] === UPLOAD_ERR_OK) {
                $fileName = uniqid() . '_' . basename($_FILES['property_images']['name'][$i]);
                $uploadPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($_FILES['property_images']['tmp_name'][$i], $uploadPath)) {
                    $uploadedImages[] = 'uploads/properties/' . $fileName;
                }
            }
        }
        
        if (!empty($uploadedImages)) {
            // Get existing images first
            $existingQuery = "SELECT images FROM properties WHERE property_id = :property_id";
            $existingStmt = $db->prepare($existingQuery);
            $existingStmt->bindParam(':property_id', $propertyId);
            $existingStmt->execute();
            $existing = $existingStmt->fetch(PDO::FETCH_ASSOC);
            
            $existingImages = [];
            if ($existing && !empty($existing['images'])) {
                $existingImages = json_decode($existing['images'], true) ?: [];
            }
            
            // Add new images to array
            $existingImages = array_merge($existingImages, $uploadedImages);
            
            $updateFields[] = "images = :images";
            $updateParams[":images"] = json_encode($existingImages);
        }
    }
    
    if (empty($updateFields)) {
        // Debug info
        $debug = [
            'input' => $input,
            'files' => $_FILES,
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set'
        ];
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "No valid fields to update",
            "debug" => $debug
        ]);
        exit();
    }
    
    // First verify the landlord owns this property
    $verifyQuery = "SELECT p.property_id FROM properties p 
                    JOIN landlords l ON p.landlord_id = l.landlord_id 
                    WHERE p.property_id = :property_id AND l.user_id = :user_id";
    $verifyStmt = $db->prepare($verifyQuery);
    $verifyStmt->bindParam(':property_id', $propertyId);
    $verifyStmt->bindParam(':user_id', $userId);
    $verifyStmt->execute();
    
    if (!$verifyStmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Property not found or access denied"
        ]);
        exit();
    }
    
    // Update property
    $updateQuery = "UPDATE properties SET " . implode(', ', $updateFields) . " WHERE property_id = :property_id";
    
    $stmt = $db->prepare($updateQuery);
    $result = $stmt->execute($updateParams);
    
    if ($result) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Property updated successfully",
            "rows_affected" => $stmt->rowCount(),
            "debug" => [
                "update_fields" => $updateFields,
                "update_params" => $updateParams,
                "query" => $updateQuery
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Property not found or update failed"
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