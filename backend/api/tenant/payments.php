<?php
header("Access-Control-Allow-Origin: https://jagasewa.cloud");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

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
    
    // Get tenant_id from tenants table
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
    
    // Get payment history
    $paymentsQuery = "SELECT 
                        payment_id,
                        amount,
                        payment_method,
                        payment_provider,
                        transaction_id,
                        status,
                        payment_date,
                        created_at
                      FROM payments
                      WHERE tenant_id = :tenant_id
                      ORDER BY payment_date DESC";
    
    $paymentsStmt = $db->prepare($paymentsQuery);
    $paymentsStmt->bindParam(':tenant_id', $tenantId);
    $paymentsStmt->execute();
    
    $payments = $paymentsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get next payment info (mock data for now - you can implement proper logic later)
    // This would typically come from a rental_agreements or invoices table
    $nextPayment = null;
    
    // Get property monthly rent
    if ($propertyId) {
        $rentQuery = "SELECT monthly_rent FROM properties WHERE property_id = :property_id";
        $rentStmt = $db->prepare($rentQuery);
        $rentStmt->bindParam(':property_id', $propertyId);
        $rentStmt->execute();
        $property = $rentStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($property) {
            // Calculate next payment due date (1st of next month)
            $nextMonth = new DateTime('first day of next month');
            $nextPayment = [
                'amount' => $property['monthly_rent'],
                'due_date' => $nextMonth->format('Y-m-d')
            ];
        }
    }
    
    // Return successful response
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Payments retrieved successfully",
        "data" => [
            "payments" => $payments,
            "next_payment" => $nextPayment
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