<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/receipt_generator.php';

// Get request body
$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if (empty($data->amount) || empty($data->payment_method) || empty($data->transaction_id) || empty($data->payment_type) || empty($data->payment_period)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Missing required fields: amount, payment_method, transaction_id, payment_type, payment_period"
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

    // Verify session token and check tenant role
    $stmt = $db->prepare("
        SELECT s.user_id, s.user_role 
        FROM sessions s 
        WHERE s.session_token = :token AND s.expires_at > NOW() AND s.user_role = 'tenant'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $user_data = ['user_id' => $session['user_id'], 'role' => $session['user_role']];
    
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
    
    // Validate payment type
    $validPaymentTypes = ['full_month', 'fortnight_1', 'fortnight_2', 'advance'];
    if (!in_array($data->payment_type, $validPaymentTypes)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid payment type']);
        exit();
    }
    
    // Set fortnight number if applicable
    $fortnightNumber = null;
    if ($data->payment_type === 'fortnight_1') {
        $fortnightNumber = 1;
    } elseif ($data->payment_type === 'fortnight_2') {
        $fortnightNumber = 2;
    }
    
    // Insert payment record
    $insertQuery = "INSERT INTO payments 
                    (tenant_id, property_id, amount, payment_type, payment_period, fortnight_number, payment_method, payment_provider, transaction_id, status, payment_date, created_at)
                    VALUES 
                    (:tenant_id, :property_id, :amount, :payment_type, :payment_period, :fortnight_number, :payment_method, :payment_provider, :transaction_id, 'completed', NOW(), NOW())";
    
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->bindParam(':tenant_id', $tenantId);
    $insertStmt->bindParam(':property_id', $propertyId);
    $insertStmt->bindParam(':amount', $data->amount);
    $insertStmt->bindParam(':payment_type', $data->payment_type);
    $insertStmt->bindParam(':payment_period', $data->payment_period);
    $insertStmt->bindParam(':fortnight_number', $fortnightNumber);
    $insertStmt->bindParam(':payment_method', $data->payment_method);
    $insertStmt->bindParam(':payment_provider', $data->payment_provider);
    $insertStmt->bindParam(':transaction_id', $data->transaction_id);
    
    if ($insertStmt->execute()) {
        $paymentId = $db->lastInsertId();
        
        // Generate receipt and store in S3
        $receiptUrl = generatePaymentReceipt($paymentId);
        
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
                "payment_date" => date('Y-m-d H:i:s'),
                "receipt_url" => $receiptUrl
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