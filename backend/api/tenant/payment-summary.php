<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/tenant_cache.php';

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
    
    $userId = $session['user_id'];
    
    // Get tenant_id from tenants table
    $tenantQuery = "SELECT tenant_id, property_id, unit_id, move_in_date FROM tenants WHERE user_id = :user_id";
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
    $unitId = $tenant['unit_id'];
    $moveInDate = $tenant['move_in_date'];
    
    // Check cache first
    $cacheKey = 'payment_summary';
    $cachedSummary = TenantCache::get($tenantId, $cacheKey);
    
    if ($cachedSummary !== null) {
        $summary = $cachedSummary;
    } else {
        // Get payment statistics
        $summaryQuery = "SELECT 
                            COUNT(*) as total_payments,
                            SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_paid,
                            AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_payment,
                            COUNT(CASE WHEN status = 'completed' THEN 1 ELSE NULL END) as completed_payments,
                            COUNT(CASE WHEN status = 'pending' THEN 1 ELSE NULL END) as pending_payments,
                            MAX(payment_date) as last_payment_date,
                            MIN(payment_date) as first_payment_date
                         FROM payments 
                         WHERE tenant_id = :tenant_id";
        
        $summaryStmt = $db->prepare($summaryQuery);
        $summaryStmt->bindParam(':tenant_id', $tenantId);
        $summaryStmt->execute();
        $paymentStats = $summaryStmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate on-time payment percentage (payments made within first 5 days of month)
        $onTimeQuery = "SELECT 
                           COUNT(*) as total_due_payments,
                           COUNT(CASE WHEN DAY(payment_date) <= 5 THEN 1 ELSE NULL END) as on_time_payments
                        FROM payments 
                        WHERE tenant_id = :tenant_id AND status = 'completed'
                        AND payment_date IS NOT NULL";
        
        $onTimeStmt = $db->prepare($onTimeQuery);
        $onTimeStmt->bindParam(':tenant_id', $tenantId);
        $onTimeStmt->execute();
        $onTimeStats = $onTimeStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get rent amount (from unit if available, otherwise from property)
        $monthlyRent = 0;
        if ($unitId) {
            $rentQuery = "SELECT monthly_rent FROM property_units WHERE unit_id = :unit_id";
            $rentStmt = $db->prepare($rentQuery);
            $rentStmt->bindParam(':unit_id', $unitId);
            $rentStmt->execute();
            $unit = $rentStmt->fetch(PDO::FETCH_ASSOC);
            $monthlyRent = $unit['monthly_rent'] ?? 0;
        }
        
        if ($monthlyRent == 0 && $propertyId) {
            $rentQuery = "SELECT monthly_rent FROM properties WHERE property_id = :property_id";
            $rentStmt = $db->prepare($rentQuery);
            $rentStmt->bindParam(':property_id', $propertyId);
            $rentStmt->execute();
            $property = $rentStmt->fetch(PDO::FETCH_ASSOC);
            $monthlyRent = $property['monthly_rent'] ?? 0;
        }
        
        // Calculate tenancy duration
        $tenancyMonths = 0;
        if ($moveInDate) {
            $start = new DateTime($moveInDate);
            $now = new DateTime();
            $interval = $start->diff($now);
            $tenancyMonths = ($interval->y * 12) + $interval->m;
        }
        
        // Calculate payment streak (consecutive months paid)
        $streakQuery = "SELECT COUNT(DISTINCT payment_period) as payment_streak
                        FROM payments 
                        WHERE tenant_id = :tenant_id AND status = 'completed'
                        AND payment_period IS NOT NULL
                        ORDER BY payment_period DESC";
        
        $streakStmt = $db->prepare($streakQuery);
        $streakStmt->bindParam(':tenant_id', $tenantId);
        $streakStmt->execute();
        $streakResult = $streakStmt->fetch(PDO::FETCH_ASSOC);
        
        // Calculate on-time percentage
        $onTimePercentage = 0;
        if ($onTimeStats['total_due_payments'] > 0) {
            $onTimePercentage = round(($onTimeStats['on_time_payments'] / $onTimeStats['total_due_payments']) * 100, 1);
        }
        
        // Get current month payment status
        $currentMonth = date('Y-m');
        $currentMonthQuery = "SELECT COUNT(*) as current_month_paid
                             FROM payments 
                             WHERE tenant_id = :tenant_id 
                             AND payment_period = :current_month 
                             AND status = 'completed'";
        
        $currentMonthStmt = $db->prepare($currentMonthQuery);
        $currentMonthStmt->bindParam(':tenant_id', $tenantId);
        $currentMonthStmt->bindParam(':current_month', $currentMonth);
        $currentMonthStmt->execute();
        $currentMonthResult = $currentMonthStmt->fetch(PDO::FETCH_ASSOC);
        
        // Build summary data
        $summary = [
            'financial' => [
                'total_paid' => floatval($paymentStats['total_paid'] ?? 0),
                'average_payment' => floatval($paymentStats['avg_payment'] ?? 0),
                'monthly_rent' => floatval($monthlyRent),
                'total_payments' => intval($paymentStats['total_payments'] ?? 0)
            ],
            'payment_behavior' => [
                'on_time_percentage' => $onTimePercentage,
                'completed_payments' => intval($paymentStats['completed_payments'] ?? 0),
                'pending_payments' => intval($paymentStats['pending_payments'] ?? 0),
                'payment_streak' => intval($streakResult['payment_streak'] ?? 0)
            ],
            'timeline' => [
                'tenancy_months' => $tenancyMonths,
                'first_payment_date' => $paymentStats['first_payment_date'],
                'last_payment_date' => $paymentStats['last_payment_date'],
                'current_month_paid' => intval($currentMonthResult['current_month_paid']) > 0
            ]
        ];
        
        // Cache the results for 1 hour
        TenantCache::set($tenantId, $cacheKey, $summary, 3600);
    }
    
    // Return successful response
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Payment summary retrieved successfully",
        "data" => $summary
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