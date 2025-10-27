<?php
include_once '../config/cors.php';
setCorsHeaders();


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Get authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$sessionToken = $matches[1];

// Get request body
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['current_password']) || !isset($data['new_password'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Current password and new password are required']);
    exit();
}

$currentPassword = $data['current_password'];
$newPassword = $data['new_password'];

// Validate new password length
if (strlen($newPassword) < 8) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'New password must be at least 8 characters long']);
    exit();
}

try {
    $database = new Database();
    $conn = $database->connect();

    // Verify session and get user data
    $stmt = $conn->prepare("
        SELECT u.user_id, u.password_hash
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.session_token = ? AND s.expires_at > NOW() AND u.user_role = 'landlord'
    ");
    $stmt->execute([$sessionToken]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit();
    }

    // Verify current password
    if (!password_verify($currentPassword, $user['password_hash'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
        exit();
    }

    // Hash new password
    $newPasswordHash = password_hash($newPassword, PASSWORD_BCRYPT);

    // Update password
    $stmt = $conn->prepare("
        UPDATE users 
        SET password_hash = ?, updated_at = NOW()
        WHERE user_id = ?
    ");
    $stmt->execute([$newPasswordHash, $user['user_id']]);

    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>