<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

try {
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
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['tenant_id'])) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Tenant ID is required"
        ]);
        exit();
    }
    
    $tenantId = $input['tenant_id'];
    $userId = $user_data['user_id'];
    
    // Verify landlord owns the property where this tenant lives
    $verifyQuery = "SELECT t.tenant_id FROM tenants t 
                    INNER JOIN properties p ON t.property_id = p.property_id 
                    INNER JOIN landlords l ON p.landlord_id = l.landlord_id 
                    WHERE t.tenant_id = :tenant_id AND l.user_id = :user_id";
    $verifyStmt = $db->prepare($verifyQuery);
    $verifyStmt->bindParam(':tenant_id', $tenantId);
    $verifyStmt->bindParam(':user_id', $userId);
    $verifyStmt->execute();
    
    if (!$verifyStmt->fetch()) {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Access denied. You can only edit tenants in your properties."
        ]);
        exit();
    }
    
    // Build update query dynamically
    $updateFields = [];
    $params = [':tenant_id' => $tenantId];
    
    $allowedFields = ['full_name', 'phone', 'move_in_date'];
    
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
    
    // Update tenant
    $updateQuery = "UPDATE tenants SET " . implode(', ', $updateFields) . " WHERE tenant_id = :tenant_id";
    $stmt = $db->prepare($updateQuery);
    $result = $stmt->execute($params);
    
    if ($result && $stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Tenant updated successfully"
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Tenant not found or no changes made"
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