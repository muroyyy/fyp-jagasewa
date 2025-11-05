<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../models/Landlord.php';

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
    
    $userId = $user_data['user_id'];
    
    // Get landlord profile information
    $landlordModel = new Landlord($db);
    $landlordProfile = $landlordModel->getLandlordByUserId($userId);
    
    if (!$landlordProfile) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Landlord profile not found"
        ]);
        exit();
    }
    
    // Return successful response with profile data
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Dashboard data retrieved successfully",
        "data" => [
            "profile" => [
                "full_name" => $landlordProfile['full_name'],
                "email" => $landlordProfile['email'],
                "phone" => $landlordProfile['phone'],
                "company_name" => $landlordProfile['company_name']
            ]
        ]
    ]);
    
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