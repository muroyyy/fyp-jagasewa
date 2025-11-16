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

$token = getBearerToken();

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Verify session token and get tenant info
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role, t.tenant_id, t.property_id
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
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit();
    }

    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $tenant_id = $session['tenant_id'];
    $property_id = $session['property_id'];

    if (empty($property_id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'You must be assigned to a property to submit maintenance requests']);
        exit();
    }

    // Get form data
    $data = $_POST;

    // Validate required fields
    if (empty($data['title']) || empty($data['description']) || empty($data['category'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Title, description, and category are required']);
        exit();
    }

    // Validate category
    $valid_categories = ['plumbing', 'electrical', 'appliances', 'hvac', 'carpentry', 'painting', 'pest_control', 'cleaning', 'other'];
    if (!in_array($data['category'], $valid_categories)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid category']);
        exit();
    }

    // Validate priority
    $valid_priorities = ['low', 'medium', 'high', 'urgent'];
    $priority = isset($data['priority']) ? $data['priority'] : 'medium';
    if (!in_array($priority, $valid_priorities)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid priority level']);
        exit();
    }

    // Handle photo uploads to S3
    $uploadedPhotos = [];
    $uploadErrors = [];
    
    if (isset($_FILES['photos']) && !empty($_FILES['photos']['name'][0])) {
        $files = $_FILES['photos'];
        $fileCount = count($files['name']);
        
        for ($i = 0; $i < $fileCount; $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $tmpName = $files['tmp_name'][$i];
                $fileName = $files['name'][$i];
                $fileSize = $files['size'][$i];
                $fileType = $files['type'][$i];
                
                // Validate file type
                $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!in_array($fileType, $allowedTypes)) {
                    $uploadErrors[] = "File '$fileName' has invalid type. Only JPEG, PNG, GIF, and WebP are allowed.";
                    continue;
                }
                
                // Validate file size (10MB max)
                if ($fileSize > 10 * 1024 * 1024) {
                    $uploadErrors[] = "File '$fileName' exceeds 10MB size limit.";
                    continue;
                }
                
                // Generate unique S3 key
                $extension = pathinfo($fileName, PATHINFO_EXTENSION);
                $uniqueId = uniqid('', true);
                $s3Key = "maintenance/tenant_{$tenant_id}_{$uniqueId}.{$extension}";
                
                // Upload to S3
                error_log("Attempting S3 upload for file: $fileName with key: $s3Key");
                $s3Url = uploadToS3($tmpName, $s3Key, $fileType);
                
                if ($s3Url) {
                    error_log("S3 upload successful: $s3Url");
                    $uploadedPhotos[] = $s3Url;
                } else {
                    error_log("S3 upload failed for file: $fileName");
                    $uploadErrors[] = "Failed to upload '$fileName' to S3. Please ensure the server has proper AWS credentials.";
                }
            } else {
                $uploadErrors[] = "File upload error for '{$files['name'][$i]}': Error code {$files['error'][$i]}";
            }
        }
    }

    // If there were upload errors and no photos were uploaded, return error
    if (!empty($uploadErrors) && empty($uploadedPhotos)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to upload photos to S3',
            'errors' => $uploadErrors
        ]);
        exit();
    }
    
    // Convert photos array to JSON
    $photosJson = !empty($uploadedPhotos) ? json_encode($uploadedPhotos) : null;

    // Insert maintenance request
    $stmt = $conn->prepare("
        INSERT INTO maintenance_requests (
            tenant_id,
            property_id,
            title,
            description,
            category,
            priority,
            status,
            preferred_date,
            photos,
            created_at,
            updated_at
        ) VALUES (
            :tenant_id,
            :property_id,
            :title,
            :description,
            :category,
            :priority,
            'pending',
            :preferred_date,
            :photos,
            NOW(),
            NOW()
        )
    ");

    $stmt->bindParam(':tenant_id', $tenant_id);
    $stmt->bindParam(':property_id', $property_id);
    $stmt->bindParam(':title', $data['title']);
    $stmt->bindParam(':description', $data['description']);
    $stmt->bindParam(':category', $data['category']);
    $stmt->bindParam(':priority', $priority);
    $preferred_date = !empty($data['preferred_date']) ? $data['preferred_date'] : null;
    $stmt->bindParam(':preferred_date', $preferred_date);
    $stmt->bindParam(':photos', $photosJson);

    if ($stmt->execute()) {
        $request_id = $conn->lastInsertId();

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Maintenance request submitted successfully',
            'data' => [
                'request_id' => $request_id,
                'photos' => $uploadedPhotos
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to submit maintenance request']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
