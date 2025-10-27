<?php
include_once '../../config/cors.php';
setCorsHeaders();


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

    // Handle image uploads
    $uploadedImages = [];
    $uploadDir = '../../uploads/properties/';
    
    // Create directory if it doesn't exist
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

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
                
                // Generate unique filename
                $extension = pathinfo($fileName, PATHINFO_EXTENSION);
                $newFileName = 'property_' . $landlord_id . '_' . time() . '_' . $i . '.' . $extension;
                $destination = $uploadDir . $newFileName;
                
                if (move_uploaded_file($tmpName, $destination)) {
                    $uploadedImages[] = 'uploads/properties/' . $newFileName;
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
            created_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $result = $stmt->execute([
        $landlord_id,
        trim($data['property_name']),
        trim($data['property_type']),
        trim($data['address']),
        trim($data['city']),
        trim($data['state']),
        trim($data['postal_code']),
        isset($data['country']) ? trim($data['country']) : 'Malaysia',
        intval($data['total_units']),
        isset($data['description']) ? trim($data['description']) : null,
        floatval($data['monthly_rent']),
        isset($data['status']) ? trim($data['status']) : 'Active',
        $imagesJson
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