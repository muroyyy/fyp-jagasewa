<?php
include_once '../config/cors.php';
setCorsHeaders();

// backend/api/landlord/tenant-details.php


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

try {
    // Get database connection (PDO)
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

    // Verify session token (PDO style)
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

    // Check if user is a landlord
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

    // Get tenant_id from query parameter
    $tenant_id = isset($_GET['tenant_id']) ? intval($_GET['tenant_id']) : 0;

    if ($tenant_id === 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Tenant ID is required.'
        ]);
        exit();
    }

    // Fetch tenant details with property information
    $query = "SELECT 
                t.tenant_id,
                t.full_name,
                t.phone,
                t.ic_number,
                t.date_of_birth,
                t.move_in_date,
                t.profile_image,
                t.created_at,
                t.updated_at,
                u.email,
                u.is_active,
                u.is_verified,
                p.property_id,
                p.property_name,
                p.property_type,
                p.monthly_rent,
                CONCAT(p.address, ', ', p.city, ', ', p.state, ' ', p.postal_code) as property_address,
                CASE 
                    WHEN u.is_active = 1 THEN 'active'
                    ELSE 'inactive'
                END as status
            FROM tenants t
            INNER JOIN users u ON t.user_id = u.user_id
            LEFT JOIN properties p ON t.property_id = p.property_id
            WHERE t.tenant_id = :tenant_id 
            AND p.landlord_id = :landlord_id";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':tenant_id', $tenant_id, PDO::PARAM_INT);
    $stmt->bindParam(':landlord_id', $landlord_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Tenant not found or does not belong to your properties.'
        ]);
        exit();
    }

    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);

    // Convert numeric values to proper types
    $tenant['tenant_id'] = (int)$tenant['tenant_id'];
    $tenant['property_id'] = (int)$tenant['property_id'];
    $tenant['monthly_rent'] = (float)$tenant['monthly_rent'];
    $tenant['is_active'] = (int)$tenant['is_active'];
    $tenant['is_verified'] = (int)$tenant['is_verified'];

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Tenant details retrieved successfully.',
        'data' => $tenant
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