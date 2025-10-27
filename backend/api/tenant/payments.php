<?php
include_once '../../../config/cors.php';
setCorsHeaders();


// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../../config/database.php';

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