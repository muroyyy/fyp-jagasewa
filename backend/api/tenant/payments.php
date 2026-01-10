<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/tenant_cache.php';

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();             // Primary for session verification
    $readDb = $database->getReadConnection();     // Replica for read-only queries

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
    
    // Get tenant_id from tenants table (using read replica)
    $tenantQuery = "SELECT tenant_id, property_id FROM tenants WHERE user_id = :user_id";
    $tenantStmt = $readDb->prepare($tenantQuery);
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
    
    // Check cache first
    $cachedPayments = TenantCache::get($tenantId, 'payments');
    
    if ($cachedPayments !== null) {
        $payments = $cachedPayments['payments'];
        $nextPayment = $cachedPayments['next_payment'];
    } else {
        // Get payment history (using read replica)
        $paymentsQuery = "SELECT
                            payment_id,
                            amount,
                            payment_method,
                            payment_provider,
                            transaction_id,
                            status,
                            payment_date,
                            receipt_url,
                            created_at
                          FROM payments
                          WHERE tenant_id = :tenant_id
                          ORDER BY payment_date DESC";

        $paymentsStmt = $readDb->prepare($paymentsQuery);
        $paymentsStmt->bindParam(':tenant_id', $tenantId);
        $paymentsStmt->execute();
        
        $payments = $paymentsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $nextPayment = null;
        
        if ($propertyId) {
            $rentQuery = "SELECT monthly_rent FROM properties WHERE property_id = :property_id";
            $rentStmt = $readDb->prepare($rentQuery);
            $rentStmt->bindParam(':property_id', $propertyId);
            $rentStmt->execute();
            $property = $rentStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($property) {
                $nextMonth = new DateTime('first day of next month');
                $nextPayment = [
                    'amount' => $property['monthly_rent'],
                    'due_date' => $nextMonth->format('Y-m-d')
                ];
            }
        }
        
        // Cache the results
        TenantCache::set($tenantId, 'payments', [
            'payments' => $payments,
            'next_payment' => $nextPayment
        ]);
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