<?php
include_once '../../config/cors.php';
setCorsHeaders();

/**
 * Forgot Password API Endpoint
 * POST /api/auth/forgot-password.php
 */


// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../config/database.php';
include_once '../../models/User.php';
include_once '../../models/PasswordReset.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);
$passwordReset = new PasswordReset($db);

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate email field
if (!empty($data->email)) {
    
    $user->email = $data->email;
    
    // Check if user exists
    if ($user->emailExists()) {
        
        try {
            // Delete any existing tokens for this user
            $passwordReset->deleteUserTokens($user->user_id);
            
            // Create new reset token
            $token = $passwordReset->createToken($user->user_id);
            
            if ($token) {
                
                // In production, send email here
                // For now, we'll return the token in response (ONLY FOR DEVELOPMENT)
                // Remove this in production and only send via email
                
                // Example reset link
                $reset_link = "http://localhost:3000/reset-password?token=" . $token;
                
                // TODO: Send email with reset link
                // sendPasswordResetEmail($user->email, $reset_link);
                
                http_response_code(200);
                echo json_encode([
                    "success" => true,
                    "message" => "Password reset instructions have been sent to your email.",
                    // REMOVE THESE IN PRODUCTION - Only for development/testing
                    "dev_only" => [
                        "token" => $token,
                        "reset_link" => $reset_link,
                        "expires_at" => $passwordReset->expires_at
                    ]
                ]);
                
            } else {
                http_response_code(500);
                echo json_encode([
                    "success" => false,
                    "message" => "Unable to generate reset token."
                ]);
            }
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Server error: " . $e->getMessage()
            ]);
        }
        
    } else {
        // For security, don't reveal if email exists or not
        // Always return success message
        http_response_code(200);
        echo json_encode([
            "success" => true,
            "message" => "If an account exists with that email, password reset instructions have been sent."
        ]);
    }
    
} else {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Email is required."
    ]);
}

/**
 * Function to send password reset email
 * Implement this with your email service (PHPMailer, SendGrid, etc.)
 */
function sendPasswordResetEmail($email, $reset_link) {
    // Email configuration
    $to = $email;
    $subject = "Password Reset Request - JagaSewa";
    $message = "
        <html>
        <head>
            <title>Password Reset Request</title>
        </head>
        <body>
            <h2>Password Reset Request</h2>
            <p>You have requested to reset your password for your JagaSewa account.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href='" . $reset_link . "'>Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this, please ignore this email.</p>
            <br>
            <p>Best regards,<br>JagaSewa Team</p>
        </body>
        </html>
    ";
    
    // Headers
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: noreply@jagasewa.com" . "\r\n";
    
    // Send email
    // In production, use PHPMailer or a service like SendGrid
    // mail($to, $subject, $message, $headers);
    
    return true;
}
?>