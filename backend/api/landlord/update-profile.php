<?php
include_once '../../config/cors.php';
setCorsHeaders();


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/s3_helper.php';

// Get authorization token using helper function
$sessionToken = getBearerToken();

if (empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

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

        // Generate unique S3 key
        $s3Key = 'profiles/landlord_' . $landlordId . '_' . time() . '.' . $fileExtension;
        
        // Delete old profile image from S3 if exists
        if ($profileImage && strpos($profileImage, 'https://') === 0) {
            try {
                $oldKey = str_replace('https://jagasewa-assets-prod.s3.ap-southeast-1.amazonaws.com/', '', $profileImage);
                deleteFromS3($oldKey);
            } catch (Exception $e) {
                error_log('Failed to delete old S3 image: ' . $e->getMessage());
            }
        }

        // Try S3 upload first, fallback to local storage
        try {
            $s3Url = uploadToS3($fileTmpPath, $s3Key, $fileType);
            if ($s3Url) {
                $profileImage = $s3Url;
            } else {
                throw new Exception('S3 upload failed');
            }
        } catch (Exception $e) {
            // Fallback to local storage
            error_log('S3 upload failed, using local storage: ' . $e->getMessage());
            $uploadDir = '../../uploads/profiles/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            $newFileName = 'landlord_' . $landlordId . '_' . time() . '.' . $fileExtension;
            $destPath = $uploadDir . $newFileName;
            if (move_uploaded_file($fileTmpPath, $destPath)) {
                $profileImage = 'uploads/profiles/' . $newFileName;
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to upload image']);
                exit();
            }
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
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>