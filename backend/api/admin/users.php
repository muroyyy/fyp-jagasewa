<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Check authentication
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Verify session token and check admin role
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role 
        FROM sessions s 
        WHERE s.session_token = :token AND s.expires_at > NOW() AND s.user_role = 'admin'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $user_data = ['user_id' => $session['user_id'], 'role' => $session['user_role']];

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all users with additional profile information
        $query = "SELECT u.user_id, u.email, u.user_role, u.is_active, u.is_verified, u.created_at, u.updated_at,
                         COALESCE(l.full_name, t.full_name, a.full_name) as full_name,
                         COALESCE(l.phone, t.phone, a.phone) as phone
                  FROM users u
                  LEFT JOIN landlords l ON u.user_id = l.user_id
                  LEFT JOIN tenants t ON u.user_id = t.user_id  
                  LEFT JOIN admins a ON u.user_id = a.user_id
                  ORDER BY u.created_at DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $users
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Create new user (admin functionality)
        $input = json_decode(file_get_contents('php://input'), true);
        
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';
        $user_role = $input['user_role'] ?? '';
        $full_name = $input['full_name'] ?? '';
        
        if (empty($email) || empty($password) || empty($user_role)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email, password, and role are required']);
            exit();
        }

        // Check if email already exists
        $check_query = "SELECT user_id FROM users WHERE email = :email";
        $check_stmt = $conn->prepare($check_query);
        $check_stmt->bindParam(':email', $email);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Email already exists']);
            exit();
        }

        // Hash password
        $password_hash = password_hash($password, PASSWORD_DEFAULT);

        // Insert user
        $user_query = "INSERT INTO users (email, password_hash, user_role, is_active, is_verified) 
                       VALUES (:email, :password_hash, :user_role, 1, 1)";
        $user_stmt = $conn->prepare($user_query);
        $user_stmt->bindParam(':email', $email);
        $user_stmt->bindParam(':password_hash', $password_hash);
        $user_stmt->bindParam(':user_role', $user_role);
        $user_stmt->execute();
        
        $user_id = $conn->lastInsertId();

        // Create profile based on role
        if ($user_role === 'landlord') {
            $profile_query = "INSERT INTO landlords (user_id, full_name) VALUES (:user_id, :full_name)";
        } elseif ($user_role === 'tenant') {
            $profile_query = "INSERT INTO tenants (user_id, full_name) VALUES (:user_id, :full_name)";
        } elseif ($user_role === 'admin') {
            $profile_query = "INSERT INTO admins (user_id, full_name) VALUES (:user_id, :full_name)";
        }

        if (isset($profile_query)) {
            $profile_stmt = $conn->prepare($profile_query);
            $profile_stmt->bindParam(':user_id', $user_id);
            $profile_stmt->bindParam(':full_name', $full_name);
            $profile_stmt->execute();
        }

        echo json_encode([
            'success' => true,
            'message' => 'User created successfully',
            'data' => ['user_id' => $user_id]
        ]);

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>