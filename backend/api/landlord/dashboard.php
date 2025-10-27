<?php
include_once '../../../config/cors.php';
setCorsHeaders();

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';
require_once '../../../models/Landlord.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
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

if (empty($token)) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Invalid token format"
    ]);
    exit();
}

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
    
    if (!$session) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid or expired session"
        ]);
        exit();
    }
    
    // Verify user is a landlord
    if ($session['user_role'] !== 'landlord') {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Access denied. Landlord access only."
        ]);
        exit();
    }
    
    $userId = $session['user_id'];
    
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