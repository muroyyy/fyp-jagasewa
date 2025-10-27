<?php
include_once '../config/cors.php';
setCorsHeaders();


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

// Get Authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader)) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Authorization header missing'
    ]);
    exit();
}

// Extract token
$token = str_replace('Bearer ', '', $authHeader);

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Verify session token
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role, t.tenant_id
        FROM sessions s
        JOIN tenants t ON s.user_id = t.user_id
        WHERE s.session_token = :token 
        AND s.expires_at > NOW()
        AND s.user_role = 'tenant'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or expired session'
        ]);
        exit();
    }

    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $tenant_id = $session['tenant_id'];

    // Get form data
    $full_name = isset($_POST['full_name']) ? $_POST['full_name'] : '';
    $phone = isset($_POST['phone']) ? $_POST['phone'] : '';

    // Validate required fields
    if (empty($full_name)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Full name is required'
        ]);
        exit();
    }

    // Handle profile image upload
    $profile_image_path = null;
    if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['profile_image'];
        
        // Validate file type
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowed_types)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed'
            ]);
            exit();
        }

        // Validate file size (5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'File size must be less than 5MB'
            ]);
            exit();
        }

        // Create uploads directory if it doesn't exist
        $upload_dir = '../../uploads/profiles/';
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }

        // Generate unique filename
        $file_extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $new_filename = 'tenant_' . $tenant_id . '_' . time() . '.' . $file_extension;
        $upload_path = $upload_dir . $new_filename;

        // Move uploaded file
        if (move_uploaded_file($file['tmp_name'], $upload_path)) {
            $profile_image_path = 'uploads/profiles/' . $new_filename;
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to upload image'
            ]);
            exit();
        }
    }

    // Update tenant profile
    if ($profile_image_path) {
        $stmt = $conn->prepare("
            UPDATE tenants 
            SET full_name = :full_name,
                phone = :phone,
                profile_image = :profile_image,
                updated_at = NOW()
            WHERE tenant_id = :tenant_id
        ");
        $stmt->bindParam(':profile_image', $profile_image_path);
    } else {
        $stmt = $conn->prepare("
            UPDATE tenants 
            SET full_name = :full_name,
                phone = :phone,
                updated_at = NOW()
            WHERE tenant_id = :tenant_id
        ");
    }

    $stmt->bindParam(':full_name', $full_name);
    $stmt->bindParam(':phone', $phone);
    $stmt->bindParam(':tenant_id', $tenant_id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => [
                'profile_image' => $profile_image_path
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update profile'
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>