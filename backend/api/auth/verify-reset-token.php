<?php
include_once '../../../config/cors.php';
setCorsHeaders();

/**
 * Verify Reset Token API Endpoint
 * GET /api/auth/verify-reset-token.php?token=xxx
 * 
 * This endpoint checks if a password reset token is valid
 * Used by frontend to validate token before showing reset form
 */


// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../../config/database.php';
include_once '../../../models/PasswordReset.php';

$database = new Database();
$db = $database->getConnection();

$passwordReset = new PasswordReset($db);

// Get token from query parameter
$token = isset($_GET['token']) ? $_GET['token'] : '';

if (!empty($token)) {
    
    // Verify token
    $verification = $passwordReset->verifyToken($token);
    
    if ($verification['valid']) {
        
        // Get user email (for display purposes)
        $email = $passwordReset->getUserEmailByToken($token);
        
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "valid" => true,
            "message" => "Token is valid.",
            "email" => $email ? maskEmail($email) : null
        ]);
        
    } else {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "valid" => false,
            "message" => $verification['message']
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "valid" => false,
        "message" => "Token is required."
    ]);
}

/**
 * Mask email for privacy
 * e.g., test@example.com -> t***@example.com
 */
function maskEmail($email) {
    $parts = explode('@', $email);
    if (count($parts) === 2) {
        $name = $parts[0];
        $domain = $parts[1];
        
        if (strlen($name) > 2) {
            $masked = substr($name, 0, 1) . str_repeat('*', strlen($name) - 1);
        } else {
            $masked = $name;
        }
        
        return $masked . '@' . $domain;
    }
    return $email;
}
?>