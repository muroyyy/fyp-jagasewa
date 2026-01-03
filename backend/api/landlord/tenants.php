<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/landlord_cache.php';

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check authentication
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Verify session token and check landlord role
    $stmt = $db->prepare("
        SELECT s.user_id, s.user_role 
        FROM sessions s 
        WHERE s.session_token = :token AND s.expires_at > NOW() AND s.user_role = 'landlord'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $userId = $session['user_id'];
    
    // Get landlord_id from landlords table
    $landlordQuery = "SELECT landlord_id FROM landlords WHERE user_id = :user_id";
    $landlordStmt = $db->prepare($landlordQuery);
    $landlordStmt->bindParam(':user_id', $userId);
    $landlordStmt->execute();
    $landlord = $landlordStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$landlord) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Landlord profile not found"
        ]);
        exit();
    }
    
    $landlordId = $landlord['landlord_id'];
    
    // Check cache first
    $cachedTenants = LandlordCache::get($landlordId, 'tenants');
    
    if ($cachedTenants !== null) {
        $tenants = $cachedTenants;
    } else {
        // Get all tenants associated with this landlord's properties (including unit assignments)
        $tenantsQuery = "SELECT DISTINCT
                            t.tenant_id,
                            t.user_id,
                            t.full_name,
                            u.email,
                            t.phone,
                            t.move_in_date,
                            t.move_out_date,
                            t.account_status,
                            COALESCE(p.property_name, p2.property_name) as property_name,
                            COALESCE(t.property_id, pu.property_id) as property_id,
                            pu.unit_number,
                            pu.unit_type,
                            CASE 
                                WHEN u.is_active = 1 THEN 'Active'
                                ELSE 'Inactive'
                            END as status
                         FROM tenants t
                         INNER JOIN users u ON t.user_id = u.user_id
                         LEFT JOIN properties p ON t.property_id = p.property_id AND p.landlord_id = ?
                         LEFT JOIN property_units pu ON t.unit_id = pu.unit_id
                         LEFT JOIN properties p2 ON pu.property_id = p2.property_id AND p2.landlord_id = ?
                         WHERE (p.landlord_id = ? OR p2.landlord_id = ?)
                         ORDER BY t.move_in_date DESC";
        
        $tenantsStmt = $db->prepare($tenantsQuery);
        $tenantsStmt->execute([$landlordId, $landlordId, $landlordId, $landlordId]);
        
        $tenants = $tenantsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Cache the results
        LandlordCache::set($landlordId, 'tenants', $tenants);
    }
    
    // Return successful response with tenants data
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Tenants retrieved successfully",
        "data" => [
            "tenants" => $tenants,
            "total_count" => count($tenants)
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Tenants API PDO Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Tenants API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>