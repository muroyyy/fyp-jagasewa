<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

// Get authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader) || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$sessionToken = $matches[1];

// Get form data
$fullName = isset($_POST['full_name']) ? trim($_POST['full_name']) : '';
$phone = isset($_POST['phone']) ? trim($_POST['phone']) : '';
$companyName = isset($_POST['company_name']) ? trim($_POST['company_name']) : '';
$address = isset($_POST['address']) ? trim($_POST['address']) : '';

if (empty($fullName) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Full name and phone are required']);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Verify session and get landlord_id
    $stmt = $conn->prepare("
        SELECT s.user_id, u.user_role, l.landlord_id, l.profile_image
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        JOIN landlords l ON u.user_id = l.user_id
        WHERE s.session_token = ? AND s.expires_at > NOW() AND u.user_role = 'landlord'
    ");
    $stmt->execute([$sessionToken]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit();
    }

    $landlordId = $session['landlord_id'];
    $profileImage = $session['profile_image'];

    // Handle profile image upload
    if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/profiles/';
        
        // Create directory if it doesn't exist
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileTmpPath = $_FILES['profile_image']['tmp_name'];
        $fileName = $_FILES['profile_image']['name'];
        $fileSize = $_FILES['profile_image']['size'];
        $fileType = $_FILES['profile_image']['type'];
        $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        // Validate file
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        if (!in_array($fileExtension, $allowedExtensions)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed']);
            exit();
        }

        if ($fileSize > 5 * 1024 * 1024) { // 5MB max
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'File size exceeds 5MB limit']);
            exit();
        }

        // Generate unique filename
        $newFileName = 'landlord_' . $landlordId . '_' . time() . '.' . $fileExtension;
        $destPath = $uploadDir . $newFileName;

        // Delete old profile image if exists
        if ($profileImage && file_exists($uploadDir . $profileImage)) {
            unlink($uploadDir . $profileImage);
        }

        // Move uploaded file
        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $profileImage = $newFileName;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
            exit();
        }
    }

    // Update landlord profile
    $stmt = $conn->prepare("
        UPDATE landlords 
        SET 
            full_name = ?,
            phone = ?,
            company_name = ?,
            address = ?,
            profile_image = ?,
            updated_at = NOW()
        WHERE landlord_id = ?
    ");
    
    $stmt->execute([
        $fullName,
        $phone,
        $companyName,
        $address,
        $profileImage,
        $landlordId
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'data' => [
            'profile_image' => $profileImage
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>