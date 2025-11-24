<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    $stmt = $db->prepare("SELECT user_id FROM sessions WHERE session_token = :token AND expires_at > NOW() AND user_role = 'tenant'");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $userId = $session['user_id'];
    
    // Get tenant info
    $tenantStmt = $db->prepare("SELECT tenant_id, property_id FROM tenants WHERE user_id = :user_id");
    $tenantStmt->bindParam(':user_id', $userId);
    $tenantStmt->execute();
    $tenant = $tenantStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tenant) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Tenant profile not found']);
        exit();
    }
    
    // Get current month in YYYY-MM format
    $currentPeriod = date('Y-m');
    
    // Check if current month is already paid
    $paymentCheckStmt = $db->prepare("
        SELECT payment_id, payment_type, amount, payment_date 
        FROM payments 
        WHERE tenant_id = :tenant_id 
        AND payment_period = :period 
        AND status = 'completed'
    ");
    $paymentCheckStmt->bindParam(':tenant_id', $tenant['tenant_id']);
    $paymentCheckStmt->bindParam(':period', $currentPeriod);
    $paymentCheckStmt->execute();
    $currentMonthPayments = $paymentCheckStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check payment status
    $fullMonthPaid = false;
    $fortnight1Paid = false;
    $fortnight2Paid = false;
    
    foreach ($currentMonthPayments as $payment) {
        if ($payment['payment_type'] === 'full_month') {
            $fullMonthPaid = true;
        } elseif ($payment['payment_type'] === 'fortnight_1') {
            $fortnight1Paid = true;
        } elseif ($payment['payment_type'] === 'fortnight_2') {
            $fortnight2Paid = true;
        }
    }
    
    // Get property monthly rent
    $rentStmt = $db->prepare("SELECT monthly_rent FROM properties WHERE property_id = :property_id");
    $rentStmt->bindParam(':property_id', $tenant['property_id']);
    $rentStmt->execute();
    $property = $rentStmt->fetch(PDO::FETCH_ASSOC);
    $monthlyRent = $property['monthly_rent'] ?? 0;
    
    // Check for pending payment requests
    $requestStmt = $db->prepare("
        SELECT request_id, request_type, status 
        FROM payment_requests 
        WHERE tenant_id = :tenant_id 
        AND payment_period = :period 
        AND status = 'pending'
    ");
    $requestStmt->bindParam(':tenant_id', $tenant['tenant_id']);
    $requestStmt->bindParam(':period', $currentPeriod);
    $requestStmt->execute();
    $pendingRequests = $requestStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Determine available payment options
    $paymentOptions = [];
    
    if ($fullMonthPaid) {
        // Already paid full month - only advance payment available
        $paymentOptions[] = [
            'type' => 'advance',
            'label' => 'Pay in Advance (Next Month)',
            'amount' => $monthlyRent,
            'period' => date('Y-m', strtotime('+1 month'))
        ];
    } else {
        // Current month not fully paid
        if (!$fortnight1Paid && !$fortnight2Paid) {
            // No payments yet - all options available
            $paymentOptions[] = [
                'type' => 'full_month',
                'label' => 'Pay Full Month',
                'amount' => $monthlyRent,
                'period' => $currentPeriod
            ];
            $paymentOptions[] = [
                'type' => 'fortnight_1',
                'label' => 'Pay First Fortnight (1st-15th)',
                'amount' => $monthlyRent / 2,
                'period' => $currentPeriod
            ];
        } elseif ($fortnight1Paid && !$fortnight2Paid) {
            // First fortnight paid - only second fortnight available
            $paymentOptions[] = [
                'type' => 'fortnight_2',
                'label' => 'Pay Second Fortnight (16th-End)',
                'amount' => $monthlyRent / 2,
                'period' => $currentPeriod
            ];
        }
    }
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'current_period' => $currentPeriod,
            'monthly_rent' => $monthlyRent,
            'payment_status' => [
                'full_month_paid' => $fullMonthPaid,
                'fortnight_1_paid' => $fortnight1Paid,
                'fortnight_2_paid' => $fortnight2Paid
            ],
            'payment_options' => $paymentOptions,
            'pending_requests' => $pendingRequests,
            'can_request_delay' => !$fullMonthPaid && count($pendingRequests) === 0
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
