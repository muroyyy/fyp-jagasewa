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

    // Verify session token and check landlord role
    $stmt = $db->prepare("
        SELECT s.user_id, s.user_role 
        FROM sessions s 
        WHERE s.session_token = :token AND s.expires_at > NOW() AND s.user_role = 'landlord'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $user_data = ['user_id' => $session['user_id'], 'role' => $session['user_role']];
    
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
    
    // Check if tenant exists and verify landlord has permission
    $verifyQuery = "SELECT t.tenant_id, t.property_id FROM tenants t WHERE t.tenant_id = :tenant_id";
    $verifyStmt = $db->prepare($verifyQuery);
    $verifyStmt->bindParam(':tenant_id', $tenantId);
    $verifyStmt->execute();
    $tenant = $verifyStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tenant) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Tenant not found"
        ]);
        exit();
    }
    
    // If tenant has a property assigned, verify landlord owns it
    if ($tenant['property_id']) {
        // Debug: Get landlord_id for current user
        $landlordQuery = "SELECT landlord_id FROM landlords WHERE user_id = :user_id";
        $landlordStmt = $db->prepare($landlordQuery);
        $landlordStmt->bindParam(':user_id', $userId);
        $landlordStmt->execute();
        $landlordData = $landlordStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$landlordData) {
            http_response_code(403);
            echo json_encode([
                "success" => false,
                "message" => "Landlord profile not found"
            ]);
            exit();
        }
        
        // Check if property belongs to this landlord
        $ownerQuery = "SELECT property_id, landlord_id FROM properties WHERE property_id = :property_id";
        $ownerStmt = $db->prepare($ownerQuery);
        $ownerStmt->bindParam(':property_id', $tenant['property_id']);
        $ownerStmt->execute();
        $propertyData = $ownerStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$propertyData || $propertyData['landlord_id'] != $landlordData['landlord_id']) {
            http_response_code(403);
            echo json_encode([
                "success" => false,
                "message" => "Access denied. Property belongs to different landlord.",
                "debug" => [
                    "tenant_property_id" => $tenant['property_id'],
                    "property_landlord_id" => $propertyData['landlord_id'] ?? null,
                    "current_landlord_id" => $landlordData['landlord_id']
                ]
            ]);
            exit();
        }
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
        "message" => "Database error: " . $e->getMessage(),
        "debug" => [
            "tenant_id" => $tenantId ?? null,
            "user_id" => $userId ?? null
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>