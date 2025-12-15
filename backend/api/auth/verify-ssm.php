<?php
/**
 * SSM Number Verification API Endpoint
 * POST /api/auth/verify-ssm.php
 */

require_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->ssm_number)) {
    
    // Simulate SSM verification process
    // In production, this would call the actual SSM API
    
    // Mock verification delay (2-3 seconds)
    sleep(rand(2, 3));
    
    // Check if SSM number already exists in database
    $stmt = $db->prepare("SELECT landlord_id FROM landlords WHERE ssm_number = :ssm_number LIMIT 1");
    $stmt->bindParam(':ssm_number', $data->ssm_number);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "SSM number already registered in our system."
        ]);
        exit();
    }
    
    // Mock SSM validation (basic format check)
    $ssm_pattern = '/^[0-9]{12}$/'; // 12 digits for Malaysian SSM
    
    if (!preg_match($ssm_pattern, $data->ssm_number)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid SSM number format. Must be 12 digits."
        ]);
        exit();
    }
    
    // Mock successful verification
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "SSM number verified successfully.",
        "data" => [
            "ssm_number" => $data->ssm_number,
            "verified" => true,
            "note" => "In production, this would verify against the actual SSM (Companies Commission of Malaysia) API."
        ]
    ]);
    
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "SSM number is required."
    ]);
}
?>