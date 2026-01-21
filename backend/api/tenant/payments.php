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
                            payment_period,
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

        $tenantInfoStmt = $readDb->prepare("
            SELECT property_id, unit_id, move_in_date
            FROM tenants
            WHERE tenant_id = :tenant_id
        ");
        $tenantInfoStmt->bindParam(':tenant_id', $tenantId);
        $tenantInfoStmt->execute();
        $tenantInfo = $tenantInfoStmt->fetch(PDO::FETCH_ASSOC);

        if ($tenantInfo) {
            $rentAmount = 0;
            if (!empty($tenantInfo['unit_id'])) {
                $unitStmt = $readDb->prepare("SELECT monthly_rent FROM property_units WHERE unit_id = :unit_id");
                $unitStmt->bindParam(':unit_id', $tenantInfo['unit_id']);
                $unitStmt->execute();
                $unit = $unitStmt->fetch(PDO::FETCH_ASSOC);
                $rentAmount = $unit['monthly_rent'] ?? 0;
            }

            if ($rentAmount == 0 && !empty($tenantInfo['property_id'])) {
                $rentStmt = $readDb->prepare("SELECT monthly_rent FROM properties WHERE property_id = :property_id");
                $rentStmt->bindParam(':property_id', $tenantInfo['property_id']);
                $rentStmt->execute();
                $property = $rentStmt->fetch(PDO::FETCH_ASSOC);
                $rentAmount = $property['monthly_rent'] ?? 0;
            }

            if ($rentAmount > 0 && !empty($tenantInfo['move_in_date'])) {
                $moveInDate = new DateTime($tenantInfo['move_in_date']);
                $moveInDay = (int)$moveInDate->format('d');
                $currentDate = new DateTime();

                $paidPeriods = [];
                foreach ($payments as $payment) {
                    if (!empty($payment['payment_period']) && $payment['status'] === 'completed') {
                        $paidPeriods[] = $payment['payment_period'];
                    }
                }

                $nextPeriod = null;
                $checkDate = new DateTime($moveInDate->format('Y-m-01'));

                if ($moveInDate > $currentDate) {
                    $nextPeriod = $moveInDate->format('Y-m');
                } else {
                    while ($checkDate <= $currentDate) {
                        $period = $checkDate->format('Y-m');
                        if (!in_array($period, $paidPeriods, true)) {
                            $nextPeriod = $period;
                            break;
                        }
                        $checkDate->add(new DateInterval('P1M'));
                    }

                    if ($nextPeriod === null) {
                        $nextPeriod = $currentDate->format('Y-m');
                        $nextPeriod = (new DateTime($nextPeriod . '-01'))
                            ->modify('first day of next month')
                            ->format('Y-m');
                    }
                }

                if ($nextPeriod) {
                    $periodDate = DateTime::createFromFormat('Y-m-d', $nextPeriod . '-01');
                    $daysInMonth = (int)$periodDate->format('t');
                    $dueDay = min($moveInDay, $daysInMonth);
                    $periodDate->setDate((int)$periodDate->format('Y'), (int)$periodDate->format('m'), $dueDay);

                    $nextPayment = [
                        'amount' => $rentAmount,
                        'due_date' => $periodDate->format('Y-m-d')
                    ];
                }
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
