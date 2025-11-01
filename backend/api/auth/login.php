<?php
/**
 * User Login API Endpoint
 * POST /api/auth/login.php
 */

include_once '../../config/cors.php';
setCorsHeaders();

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// only two levels up
include_once '../../config/database.php';
include_once '../../config/auth_helper.php';
include_once '../../models/User.php';
include_once '../../models/Landlord.php';
include_once '../../models/Tenant.php';

// Create DB connection
$database = new Database();
$db = $database->getConnection();

$user = new User($db);

// Get and decode request body
$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (!empty($data->email) && !empty($data->password)) {
    // Set user properties
    $user->email = $data->email;
    $user->password_hash = $data->password;
    $user_role = $data->role ?? null;

    // Attempt login
    $login_result = $user->login($user_role);

    if ($login_result['success']) {
        // Get complete user profile based on role
        $profile_data = null;

        if ($login_result['user_role'] === 'landlord') {
            $landlord = new Landlord($db);
            $profile_data = $landlord->getByUserId($login_result['user_id']);
        } elseif ($login_result['user_role'] === 'tenant') {
            $tenant = new Tenant($db);
            $profile_data = $tenant->getByUserId($login_result['user_id']);
        } elseif ($login_result['user_role'] === 'admin') {
            // Get admin profile data
            $admin_query = "SELECT full_name, phone, department, profile_image FROM admins WHERE user_id = :user_id";
            $admin_stmt = $db->prepare($admin_query);
            $admin_stmt->bindParam(':user_id', $login_result['user_id']);
            $admin_stmt->execute();
            $profile_data = $admin_stmt->fetch(PDO::FETCH_ASSOC);
        }

        // Generate session token
        $session_token = bin2hex(random_bytes(32));
        $expires_at = date('Y-m-d H:i:s', strtotime('+2 hours'));

        try {
            // Store session in database (basic version until SQL update)
            $session_query = "INSERT INTO sessions (user_id, session_token, user_role, expires_at, created_at) 
                              VALUES (:user_id, :session_token, :user_role, :expires_at, NOW())";
            $session_stmt = $db->prepare($session_query);
            $session_stmt->bindParam(':user_id', $login_result['user_id']);
            $session_stmt->bindParam(':session_token', $session_token);
            $session_stmt->bindParam(':user_role', $login_result['user_role']);
            $session_stmt->bindParam(':expires_at', $expires_at);
            $session_stmt->execute();

            // Return successful response
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
        } catch (PDOException $e) {
            // Session creation failed
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Login successful but session creation failed: " . $e->getMessage()
            ]);
        }
    } else {
        // Login failed (invalid password, deactivated, or wrong role)
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => $login_result['message']
        ]);
    }
} else {
    // Missing required fields
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Unable to login. Email and password are required."
    ]);
}
?>
