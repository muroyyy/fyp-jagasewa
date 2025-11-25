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

$sessionToken = getBearerToken();

if (empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['property_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Property ID is required']);
    exit();
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
    $property_id = $data['property_id'];

    // Get property details and verify ownership
    $stmt = $conn->prepare("
        SELECT images FROM properties 
        WHERE property_id = ? AND landlord_id = ?
    ");
    $stmt->execute([$property_id, $landlord_id]);
    $property = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$property) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Property not found or access denied']);
        exit();
    }

    // Delete images from S3
    if (!empty($property['images'])) {
        $images = json_decode($property['images'], true);
        foreach ($images as $imageUrl) {
            if (strpos($imageUrl, 'https://jagasewa-assets-prod.s3.') === 0) {
                $s3Key = str_replace('https://jagasewa-assets-prod.s3.ap-southeast-1.amazonaws.com/', '', $imageUrl);
                deleteFromS3($s3Key);
            }
        }
    }

    // Delete property
    $stmt = $conn->prepare("DELETE FROM properties WHERE property_id = ? AND landlord_id = ?");
    $result = $stmt->execute([$property_id, $landlord_id]);

    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Property deleted successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete property']);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
