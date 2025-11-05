<?php
header("Access-Control-Allow-Origin: https://jagasewa.cloud");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

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
    
    // Check authentication
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Verify token and check tenant role
    $user_data = verifyJWT($token);
    if (!$user_data || $user_data['role'] !== 'tenant') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $userId = $user_data['user_id'];
    
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