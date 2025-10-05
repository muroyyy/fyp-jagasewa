<?php
/**
 * User Login API Endpoint
 * POST /api/auth/login.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';
include_once '../../models/User.php';
include_once '../../models/Landlord.php';
include_once '../../models/Tenant.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (!empty($data->email) && !empty($data->password)) {
    
    // Set user properties
    $user->email = $data->email;
    $user->password_hash = $data->password;
    
    // Attempt login
    $login_result = $user->login();
    
    if ($login_result['success']) {
        
        // Get complete user profile based on role
        $profile_data = null;
        
        if ($login_result['user_role'] === 'landlord') {
            $landlord = new Landlord($db);
            $profile_data = $landlord->getByUserId($login_result['user_id']);
        } elseif ($login_result['user_role'] === 'tenant') {
            $tenant = new Tenant($db);
            $profile_data = $tenant->getByUserId($login_result['user_id']);
        }
        
        // Generate session token (in production, use JWT)
        $session_token = bin2hex(random_bytes(32));
        
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "Login successful.",
            "data" => [
                "user_id" => $login_result['user_id'],
                "email" => $login_result['email'],
                "user_role" => $login_result['user_role'],
                "is_verified" => $login_result['is_verified'],
                "profile" => $profile_data,
                "session_token" => $session_token
            ]
        ]);
        
    } else {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => $login_result['message']
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Unable to login. Email and password are required."
    ]);
}
?>