<?php
include_once '../../config/cors.php';
setCorsHeaders();


// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Method not allowed"
    ]);
    exit();
}

// Get authorization header
// Get authorization token using helper function
$token = getBearerToken();
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

// Get request body
$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (empty($data->amount) || empty($data->payment_method) || empty($data->transaction_id)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields: amount, payment_method, transaction_id"
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
    
    // Verify user is a tenant
    if ($session['user_role'] !== 'tenant') {
        http_response_code(403);
        echo json_encode([
            "success" => false,
            "message" => "Access denied. Tenant access only."
        ]);
        exit();
    }
    
    $userId = $session['user_id'];
    
    // Get tenant_id and property_id from tenants table
    $tenantQuery = "SELECT tenant_id, property_id FROM tenants WHERE user_id = :user_id";
    $tenantStmt = $db->prepare($tenantQuery);
    $tenantStmt->bindParam(':user_id', $userId);
    $tenantStmt->execute();
    $tenant = $tenantStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tenant) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Tenant profile not found"
        ]);
        exit();
    }
    
    $tenantId = $tenant['tenant_id'];
    $propertyId = $tenant['property_id'];
    
    // Insert payment record
    $insertQuery = "INSERT INTO payments 
                    (tenant_id, property_id, amount, payment_method, payment_provider, transaction_id, status, payment_date, created_at)
                    VALUES 
                    (:tenant_id, :property_id, :amount, :payment_method, :payment_provider, :transaction_id, 'completed', NOW(), NOW())";
    
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindParam(':tenant_id', $tenantId);
    $insertStmt->bindParam(':property_id', $propertyId);
    $insertStmt->bindParam(':amount', $data->amount);
    $insertStmt->bindParam(':payment_method', $data->payment_method);
    $insertStmt->bindParam(':payment_provider', $data->payment_provider);
    $insertStmt->bindParam(':transaction_id', $data->transaction_id);
    
    if ($insertStmt->execute()) {
        $paymentId = $db->lastInsertId();
        
        // Return successful response
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Payment recorded successfully",
            "data" => [
                "payment_id" => $paymentId,
                "transaction_id" => $data->transaction_id,
                "amount" => $data->amount,
                "status" => "completed",
                "payment_date" => date('Y-m-d H:i:s')
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to record payment"
        ]);
    }
    
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