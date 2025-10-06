<?php
/**
 * User Registration API Endpoint
 * POST /api/auth/register.php
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
if (
    !empty($data->email) &&
    !empty($data->password) &&
    !empty($data->user_role) &&
    !empty($data->full_name) &&
    !empty($data->phone)
) {
    
    // Set user properties
    $user->email = $data->email;
    $user->password_hash = $data->password;
    $user->user_role = $data->user_role;
    $user->is_verified = 0; // Email verification required (0 = false, 1 = true)
    
    // Check if email already exists
    if ($user->emailExists()) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Email already exists."
        ]);
        exit();
    }
    
    // Start transaction
    try {
        $db->beginTransaction();
        
        // Create user account
        if ($user->register()) {
            
            // Create role-specific profile
            if ($user->user_role === 'landlord') {
                
                $landlord = new Landlord($db);
                $landlord->user_id = $user->user_id;
                $landlord->full_name = $data->full_name;
                $landlord->phone = $data->phone;
                $landlord->company_name = isset($data->company_name) ? $data->company_name : null;
                $landlord->address = $data->address;
                
                if ($landlord->create()) {
                    $db->commit();
                    
                    http_response_code(201);
                    echo json_encode([
                        "success" => true,
                        "message" => "Landlord account created successfully.",
                        "data" => [
                            "user_id" => $user->user_id,
                            "email" => $user->email,
                            "user_role" => $user->user_role,
                            "landlord_id" => $landlord->landlord_id
                        ]
                    ]);
                } else {
                    $db->rollBack();
                    http_response_code(503);
                    echo json_encode([
                        "success" => false,
                        "message" => "Unable to create landlord profile."
                    ]);
                }
                
            } elseif ($user->user_role === 'tenant') {
                
                $tenant = new Tenant($db);
                $tenant->user_id = $user->user_id;
                $tenant->full_name = $data->full_name;
                $tenant->phone = $data->phone;
                $tenant->ic_number = $data->ic_number;
                $tenant->date_of_birth = $data->date_of_birth;
                
                // Check if IC number already exists
                if ($tenant->icNumberExists()) {
                    $db->rollBack();
                    http_response_code(400);
                    echo json_encode([
                        "success" => false,
                        "message" => "IC number already registered."
                    ]);
                    exit();
                }
                
                if ($tenant->create()) {
                    $db->commit();
                    
                    http_response_code(201);
                    echo json_encode([
                        "success" => true,
                        "message" => "Tenant account created successfully.",
                        "data" => [
                            "user_id" => $user->user_id,
                            "email" => $user->email,
                            "user_role" => $user->user_role,
                            "tenant_id" => $tenant->tenant_id
                        ]
                    ]);
                } else {
                    $db->rollBack();
                    http_response_code(503);
                    echo json_encode([
                        "success" => false,
                        "message" => "Unable to create tenant profile."
                    ]);
                }
                
            } else {
                $db->rollBack();
                http_response_code(400);
                echo json_encode([
                    "success" => false,
                    "message" => "Invalid user role."
                ]);
            }
            
        } else {
            $db->rollBack();
            http_response_code(503);
            echo json_encode([
                "success" => false,
                "message" => "Unable to register user."
            ]);
        }
        
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Registration failed: " . $e->getMessage()
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Unable to register. Required data is missing.",
        "required_fields" => [
            "email",
            "password",
            "user_role",
            "full_name",
            "phone",
            "Additional fields for landlord: address",
            "Additional fields for tenant: ic_number, date_of_birth"
        ]
    ]);
}
?>