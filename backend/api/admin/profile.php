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

    // Verify token and check admin role
    $user_data = verifyJWT($token);
    if (!$user_data || $user_data['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get admin profile
        $query = "SELECT u.email, a.full_name, a.phone, a.department, a.profile_image, a.created_at, a.updated_at
                  FROM users u
                  JOIN admins a ON u.user_id = a.user_id
                  WHERE u.user_id = :user_id";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':user_id', $user_data['user_id']);
        $stmt->execute();
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($profile) {
            echo json_encode([
                'success' => true,
                'data' => $profile
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Admin profile not found']);
        }

    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Update admin profile
        $full_name = $_POST['full_name'] ?? '';
        $phone = $_POST['phone'] ?? '';
        $department = $_POST['department'] ?? '';
        
        // Handle file upload
        $profile_image_path = null;
        if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
            $upload_dir = '../../uploads/profiles/';
            if (!is_dir($upload_dir)) {
                mkdir($upload_dir, 0755, true);
            }

            $file_extension = pathinfo($_FILES['profile_image']['name'], PATHINFO_EXTENSION);
            $filename = 'admin_' . $user_data['user_id'] . '_' . time() . '.' . $file_extension;
            $upload_path = $upload_dir . $filename;

            if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $upload_path)) {
                $profile_image_path = 'uploads/profiles/' . $filename;
            }
        }

        // Update admin profile
        if ($profile_image_path) {
            $query = "UPDATE admins SET full_name = :full_name, phone = :phone, department = :department, 
                      profile_image = :profile_image, updated_at = CURRENT_TIMESTAMP 
                      WHERE user_id = :user_id";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(':profile_image', $profile_image_path);
        } else {
            $query = "UPDATE admins SET full_name = :full_name, phone = :phone, department = :department, 
                      updated_at = CURRENT_TIMESTAMP 
                      WHERE user_id = :user_id";
            $stmt = $conn->prepare($query);
        }

        $stmt->bindParam(':full_name', $full_name);
        $stmt->bindParam(':phone', $phone);
        $stmt->bindParam(':department', $department);
        $stmt->bindParam(':user_id', $user_data['user_id']);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully'
            ]);
        } else {
            echo json_encode([
                'success' => true,
                'message' => 'No changes made'
            ]);
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>