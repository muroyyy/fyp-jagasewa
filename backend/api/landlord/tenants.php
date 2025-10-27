<?php
include_once '../../config/cors.php';
setCorsHeaders();


// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);
    exit();
}

// Get authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader)) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "No authorization token provided"
    ]);
    exit();
}

// Extract token from "Bearer <token>"
$token = str_replace('Bearer ', '', $authHeader);

if (empty($token)) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Invalid token format"
    ]);
    exit();
}

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Verify token and get user from sessions table
    $query = "SELECT user_id, user_role FROM sessions WHERE session_token = :token AND expires_at > NOW()";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(401);
        echo json_encode([
            "success" => false,
            "message" => "Invalid or expired session"
        ]);
        exit();
    }
    
    // Verify user is a landlord
    if ($session['user_role'] !== 'landlord') {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Access denied. Landlord access only."
        ]);
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
    
    // Get all tenants associated with this landlord's properties
    $tenantsQuery = "SELECT DISTINCT
                        t.tenant_id,
                        t.full_name,
                        u.email,
                        t.phone,
                        t.move_in_date,
                        p.property_name,
                        p.property_id,
                        CASE 
                            WHEN u.is_active = 1 THEN 'Active'
                            ELSE 'Inactive'
                        END as status
                     FROM tenants t
                     INNER JOIN users u ON t.user_id = u.user_id
                     INNER JOIN properties p ON t.property_id = p.property_id
                     WHERE p.landlord_id = :landlord_id
                     ORDER BY t.move_in_date DESC";
    
    $tenantsStmt = $db->prepare($tenantsQuery);
    $tenantsStmt->bindParam(':landlord_id', $landlordId);
    $tenantsStmt->execute();
    
    $tenants = $tenantsStmt->fetchAll(PDO::FETCH_ASSOC);
    
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
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>