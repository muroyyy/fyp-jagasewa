<?php
include_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

$sessionToken = getBearerToken();

if (empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();           // Primary for session verification
    $readConn = $database->getReadConnection();   // Replica for read-only queries

    // Verify session and get landlord_id
    $stmt = $conn->prepare("
        SELECT s.user_id, u.user_role, l.landlord_id
        FROM sessions s
        JOIN users u ON s.user_id = u.user_id
        JOIN landlords l ON u.user_id = l.user_id
        WHERE s.session_token = ? AND s.expires_at > NOW() AND u.user_role = 'landlord'
    ");
    $stmt->execute([$sessionToken]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$session) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit();
    }

    $landlordId = $session['landlord_id'];

    // Get all tenants with their move-in dates and property details (using read replica)
    $stmt = $readConn->prepare("
        SELECT
            t.tenant_id,
            t.full_name as tenant_name,
            t.move_in_date,
            t.move_out_date,
            pr.property_id,
            pr.property_name,
            pr.monthly_rent
        FROM tenants t
        JOIN properties pr ON t.property_id = pr.property_id
        WHERE pr.landlord_id = ?
        AND t.move_in_date IS NOT NULL
        AND (t.move_out_date IS NULL OR t.move_out_date > NOW())
        AND t.account_status = 'active'
    ");
    $stmt->execute([$landlordId]);
    $tenants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $pendingPayments = [];
    $currentDate = new DateTime();

    foreach ($tenants as $tenant) {
        $moveInDate = new DateTime($tenant['move_in_date']);

        // Start generating payments from the move-in month
        $firstPaymentMonth = new DateTime($moveInDate->format('Y-m-01'));
        $moveInDay = (int)$moveInDate->format('d');

        // Generate expected payment months from first payment month to current date
        $expectedMonths = [];
        $checkDate = clone $firstPaymentMonth;

        while ($checkDate <= $currentDate) {
            $expectedMonths[] = $checkDate->format('Y-m');
            $checkDate->add(new DateInterval('P1M'));
        }

        // Only process if there are expected payments
        if (!empty($expectedMonths)) {
            // Check payments made by this tenant (using read replica)
            $paymentStmt = $readConn->prepare("
                SELECT
                    payment_date,
                    payment_period,
                    status
                FROM payments
                WHERE tenant_id = ? AND status = 'completed'
                ORDER BY payment_date DESC
            ");
            $paymentStmt->execute([$tenant['tenant_id']]);
            $payments = $paymentStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Create array of paid months
            $paidMonths = [];
            foreach ($payments as $payment) {
                if (!empty($payment['payment_period'])) {
                    $paidMonths[] = $payment['payment_period'];
                }
            }
            
            // Find missing payments
            foreach ($expectedMonths as $expectedMonth) {
                if (!in_array($expectedMonth, $paidMonths)) {
                    // Calculate due date based on move-in day for the period
                    $dueDate = DateTime::createFromFormat('Y-m-d', $expectedMonth . '-01');
                    $daysInMonth = (int)$dueDate->format('t');
                    $dueDay = min($moveInDay, $daysInMonth);
                    $dueDate->setDate((int)$dueDate->format('Y'), (int)$dueDate->format('m'), $dueDay);
                    
                    // Check if payment is overdue (more than 5 days past due date)
                    $daysPastDue = $currentDate > $dueDate ? $currentDate->diff($dueDate)->days : 0;
                    $isOverdue = $currentDate > $dueDate && $daysPastDue > 5;
                    
                    $pendingPayments[] = [
                        'tenant_id' => $tenant['tenant_id'],
                        'tenant_name' => $tenant['tenant_name'],
                        'property_id' => $tenant['property_id'],
                        'property_name' => $tenant['property_name'],
                        'amount' => $tenant['monthly_rent'],
                        'payment_period' => $expectedMonth,
                        'due_date' => $dueDate->format('Y-m-d'),
                        'days_overdue' => $daysPastDue,
                        'status' => $isOverdue ? 'overdue' : 'pending',
                        'payment_type' => 'full_month'
                    ];
                }
            }
        }
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'pending_payments' => $pendingPayments,
            'total_count' => count($pendingPayments)
        ],
        'debug' => [
            'current_date' => $currentDate->format('Y-m-d H:i:s'),
            'tenants_processed' => count($tenants)
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
