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

// Get POST data
$data = $_POST; // For multipart/form-data

// Validate required fields
$required_fields = ['property_name', 'property_type', 'address', 'city', 'state', 'postal_code', 'total_units', 'monthly_rent'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty(trim($data[$field]))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required']);
        exit();
    }
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Verify session and get landlord_id
    $stmt = $conn->prepare("
        SELECT l.landlord_id
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

    $landlord_id = $session['landlord_id'];

    // Handle main image upload
    $mainImageUrl = null;
    if (isset($_FILES['main_image']) && $_FILES['main_image']['error'] === UPLOAD_ERR_OK) {
        $tmpName = $_FILES['main_image']['tmp_name'];
        $fileName = $_FILES['main_image']['name'];
        $fileSize = $_FILES['main_image']['size'];
        $fileType = $_FILES['main_image']['type'];
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        if (in_array($fileType, $allowedTypes) && $fileSize <= 5 * 1024 * 1024) {
            // Sanitize filename: remove spaces, special chars, keep only alphanumeric, dots, hyphens
            $sanitizedFileName = sanitizeFilename($fileName);
            $s3Key = 'properties/main/' . uniqid() . '_' . $sanitizedFileName;
            $mainImageUrl = uploadToS3($tmpName, $s3Key, $fileType);
            
            // If main image upload fails, return error
            if (!$mainImageUrl) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'Failed to upload main image']);
                exit();
            }
        }
    }

    // Handle additional images upload
    $uploadedImages = [];
    if (isset($_FILES['property_images']) && !empty($_FILES['property_images']['name'][0])) {
        $files = $_FILES['property_images'];
        $fileCount = count($files['name']);
        
        for ($i = 0; $i < $fileCount; $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $tmpName = $files['tmp_name'][$i];
                $fileName = $files['name'][$i];
                $fileSize = $files['size'][$i];
                $fileType = $files['type'][$i];
                
                // Validate file type
                $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                if (!in_array($fileType, $allowedTypes)) {
                    continue;
                }
                
                // Validate file size (5MB max)
                if ($fileSize > 5 * 1024 * 1024) {
                    continue;
                }
                
                // Upload to S3 with sanitized filename
                $sanitizedFileName = sanitizeFilename($fileName);
                $s3Key = 'properties/' . uniqid() . '_' . $sanitizedFileName;
                $s3Url = uploadToS3($tmpName, $s3Key, $fileType);
                
                if ($s3Url) {
                    $uploadedImages[] = $s3Url;
                }
            }
        }
    }

    // Convert images array to JSON
    $imagesJson = !empty($uploadedImages) ? json_encode($uploadedImages) : null;

    // Insert new property
    $stmt = $conn->prepare("
        INSERT INTO properties (
            landlord_id,
            property_name,
            property_type,
            address,
            city,
            state,
            postal_code,
            country,
            total_units,
            description,
            monthly_rent,
            status,
            images,
            main_image,
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $result = $stmt->execute([
        $landlord_id,
        trim($data['property_name']),
        $data['property_type'] === 'Others' ? trim($data['custom_property_type']) : trim($data['property_type']),
        trim($data['address']),
        trim($data['city']),
        trim($data['state']),
        trim($data['postal_code']),
        isset($data['country']) ? trim($data['country']) : 'Malaysia',
        intval($data['total_units']),
        isset($data['description']) ? trim($data['description']) : null,
        floatval($data['monthly_rent']),
        isset($data['status']) ? trim($data['status']) : 'Active',
        $imagesJson,
        $mainImageUrl
    ]);

    if ($result) {
        $property_id = $conn->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Property added successfully',
            'data' => [
                'property_id' => $property_id,
                'images' => $uploadedImages
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to add property']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>