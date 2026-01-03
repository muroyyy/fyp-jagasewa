<?php
include_once '../../config/cors.php';
setCorsHeaders();


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/landlord_cache.php';

// Get authorization token using helper function
$sessionToken = getBearerToken();

if (empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
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

    // Check cache first
    $cachedProperties = LandlordCache::get($landlord_id, 'properties');
    
    if ($cachedProperties !== null) {
        $properties = $cachedProperties;
    } else {
        // Get all properties for this landlord with tenant counts
        $stmt = $conn->prepare("
            SELECT 
                p.property_id,
                p.landlord_id,
                p.property_name,
                p.property_type,
                p.address,
                p.city,
                p.state,
                p.postal_code,
                p.country,
                p.total_units,
                p.description,
                p.monthly_rent,
                p.status,
                p.images,
                p.main_image,
                p.created_at,
                p.updated_at,
                COUNT(t.tenant_id) as tenant_count
            FROM properties p
            LEFT JOIN tenants t ON p.property_id = t.property_id AND t.account_status = 'active'
            WHERE p.landlord_id = ?
            GROUP BY p.property_id
            ORDER BY p.created_at DESC
        ");
        $stmt->execute([$landlord_id]);
        $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode images JSON and prepare image array for each property
        foreach ($properties as &$property) {
            $imageArray = [];
            
            // Add main image first if it exists
            if (!empty($property['main_image'])) {
                $imageArray[] = $property['main_image'];
            }
            
            // Add additional images
            if (!empty($property['images'])) {
                $additionalImages = json_decode($property['images'], true);
                if (is_array($additionalImages)) {
                    $imageArray = array_merge($imageArray, $additionalImages);
                }
            }
            
            // Set the images array (main image + additional images)
            $property['images'] = $imageArray;
        }
        
        // Cache the results
        LandlordCache::set($landlord_id, 'properties', $properties);
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'properties' => $properties,
            'total' => count($properties)
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