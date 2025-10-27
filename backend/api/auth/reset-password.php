<?php
include_once '../config/cors.php';
setCorsHeaders();

/**
 * Reset Password API Endpoint
 * Handles password reset requests
 */


// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit();
}

require_once '../config/database.php';
require_once '../models/PasswordReset.php';

// Get JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validate input
if (!isset($data['token']) || !isset($data['password'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Token and password are required'
    ]);
    exit();
}

$token = trim($data['token']);
$new_password = trim($data['password']);

// Validate password length
if (strlen($new_password) < 8) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 8 characters long'
    ]);
    exit();
}

try {
    // Get database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Initialize PasswordReset model
    $passwordReset = new PasswordReset($db);
    
    // Verify token and get user_id
    $reset_data = $passwordReset->verifyToken($token);
    
    // Check if token is invalid or expired
    if (!$reset_data['valid']) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $reset_data['message']
        ]);
        exit();
    }
    
    $user_id = $reset_data['user_id'];
    
    // Hash the new password
    $password_hash = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Update user's password
    $query = "UPDATE users 
              SET password_hash = :password_hash, 
                  updated_at = CURRENT_TIMESTAMP 
              WHERE user_id = :user_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':password_hash', $password_hash);
    $stmt->bindParam(':user_id', $user_id);
    
    if ($stmt->execute()) {
        // Mark token as used
        $passwordReset->markTokenAsUsed($token);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Password has been reset successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update password. Please try again.'
        ]);
    }
    
} catch (Exception $e) {
    error_log("Reset password error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error occurred. Please try again later.'
    ]);
}
?>