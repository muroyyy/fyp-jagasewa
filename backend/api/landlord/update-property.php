<?php
include_once '../../config/cors.php';
setCorsHeaders();

// backend/api/landlord/update-property.php


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Check authentication
    $headers = apache_request_headers();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Unauthorized. No token provided.'
        ]);
        exit();
    }

    $token = $matches[1];

    // Verify session token
    $query = "SELECT s.user_id, s.user_role 
              FROM sessions s 
              WHERE s.session_token = :token 
              AND s.expires_at > NOW()";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or expired session.'
        ]);
        exit();
    }

    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($session['user_role'] !== 'landlord') {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Access denied. Landlords only.'
        ]);
        exit();
    }

    // Get landlord_id
    $query = "SELECT landlord_id FROM landlords WHERE user_id = :user_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':user_id', $session['user_id']);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Landlord profile not found.'
        ]);
        exit();
    }

    $landlord = $stmt->fetch(PDO::FETCH_ASSOC);
    $landlord_id = $landlord['landlord_id'];

    // Get form data
    $property_id = isset($_POST['property_id']) ? intval($_POST['property_id']) : 0;
    $property_name = isset($_POST['property_name']) ? trim($_POST['property_name']) : '';
    $property_type = isset($_POST['property_type']) ? trim($_POST['property_type']) : '';
    $address = isset($_POST['address']) ? trim($_POST['address']) : '';
    $city = isset($_POST['city']) ? trim($_POST['city']) : '';
    $state = isset($_POST['state']) ? trim($_POST['state']) : '';
    $postal_code = isset($_POST['postal_code']) ? trim($_POST['postal_code']) : '';
    $country = isset($_POST['country']) ? trim($_POST['country']) : '';
    $total_units = isset($_POST['total_units']) ? intval($_POST['total_units']) : 0;
    $description = isset($_POST['description']) ? trim($_POST['description']) : '';
    $monthly_rent = isset($_POST['monthly_rent']) ? floatval($_POST['monthly_rent']) : 0;
    $status = isset($_POST['status']) ? trim($_POST['status']) : 'Active';

    // Validate required fields
    if (empty($property_id) || empty($property_name) || empty($property_type) || empty($address) || 
        empty($city) || empty($state) || empty($postal_code) || empty($country) || 
        $total_units <= 0 || $monthly_rent <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'All required fields must be filled.'
        ]);
        exit();
    }

    // Verify property belongs to landlord
    $query = "SELECT property_id, images FROM properties WHERE property_id = :property_id AND landlord_id = :landlord_id";
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':property_id', $property_id, PDO::PARAM_INT);
    $stmt->bindParam(':landlord_id', $landlord_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Property not found or does not belong to you.'
        ]);
        exit();
    }

    $currentProperty = $stmt->fetch(PDO::FETCH_ASSOC);
    $currentImages = !empty($currentProperty['images']) ? json_decode($currentProperty['images'], true) : [];

    // Handle image deletion
    $imagesToDelete = isset($_POST['images_to_delete']) ? json_decode($_POST['images_to_delete'], true) : [];
    $existingImages = isset($_POST['existing_images']) ? json_decode($_POST['existing_images'], true) : [];

    // Delete marked images from server
    foreach ($imagesToDelete as $imagePath) {
        $fullPath = '../../' . $imagePath;
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
    }

    // Handle new image uploads
    $uploadedImages = [];
    if (isset($_FILES['property_images']) && !empty($_FILES['property_images']['name'][0])) {
        $uploadDir = '../../uploads/properties/';
        
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        foreach ($_FILES['property_images']['tmp_name'] as $key => $tmpName) {
            if (empty($tmpName)) continue;

            $fileName = $_FILES['property_images']['name'][$key];
            $fileSize = $_FILES['property_images']['size'][$key];
            $fileType = $_FILES['property_images']['type'][$key];
            $fileError = $_FILES['property_images']['error'][$key];

            if ($fileError !== UPLOAD_ERR_OK) {
                continue;
            }

            if (!in_array($fileType, $allowedTypes)) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Invalid file type. Only JPG, PNG, and GIF are allowed.'
                ]);
                exit();
            }

            if ($fileSize > $maxSize) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'File size must be less than 5MB.'
                ]);
                exit();
            }

            $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
            $newFileName = 'property_' . $property_id . '_' . time() . '_' . $key . '.' . $fileExtension;
            $destination = $uploadDir . $newFileName;

            if (move_uploaded_file($tmpName, $destination)) {
                $uploadedImages[] = 'uploads/properties/' . $newFileName;
            }
        }
    }

    // Merge existing images with newly uploaded images
    $finalImages = array_merge($existingImages, $uploadedImages);
    $imagesJson = json_encode($finalImages);

    // Update property
    $query = "UPDATE properties 
              SET property_name = :property_name,
                  property_type = :property_type,
                  address = :address,
                  city = :city,
                  state = :state,
                  postal_code = :postal_code,
                  country = :country,
                  total_units = :total_units,
                  description = :description,
                  monthly_rent = :monthly_rent,
                  status = :status,
                  images = :images,
                  updated_at = NOW()
              WHERE property_id = :property_id";
    
    $stmt = $conn->prepare($query);
    $stmt->bindParam(':property_name', $property_name);
    $stmt->bindParam(':property_type', $property_type);
    $stmt->bindParam(':address', $address);
    $stmt->bindParam(':city', $city);
    $stmt->bindParam(':state', $state);
    $stmt->bindParam(':postal_code', $postal_code);
    $stmt->bindParam(':country', $country);
    $stmt->bindParam(':total_units', $total_units, PDO::PARAM_INT);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':monthly_rent', $monthly_rent);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':images', $imagesJson);
    $stmt->bindParam(':property_id', $property_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Property updated successfully.'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update property.'
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