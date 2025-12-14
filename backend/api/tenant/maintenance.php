<?php
include_once '../../config/cors.php';
setCorsHeaders();


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/tenant_cache.php';

$token = getBearerToken();

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

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

    // Check cache first
    $cachedRequests = TenantCache::get($tenant_id, 'maintenance');
    
    if ($cachedRequests !== null) {
        $requests = $cachedRequests;
    } else {
        // Get all maintenance requests for this tenant
        $stmt = $conn->prepare("
            SELECT 
                mr.*,
                p.property_name
            FROM maintenance_requests mr
            LEFT JOIN properties p ON mr.property_id = p.property_id
            WHERE mr.tenant_id = :tenant_id
            ORDER BY 
                CASE mr.status
                    WHEN 'pending' THEN 1
                    WHEN 'in_progress' THEN 2
                    WHEN 'completed' THEN 3
                    WHEN 'cancelled' THEN 4
                END,
                mr.created_at DESC
        ");
        $stmt->bindParam(':tenant_id', $tenant_id);
        $stmt->execute();

        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Parse photos JSON for each request
        foreach ($requests as &$request) {
            if (!empty($request['photos'])) {
                $request['photos'] = json_decode($request['photos'], true);
            } else {
                $request['photos'] = [];
            }
        }
        
        // Cache the results
        TenantCache::set($tenant_id, 'maintenance', $requests);
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Maintenance requests retrieved successfully',
        'data' => [
            'requests' => $requests
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