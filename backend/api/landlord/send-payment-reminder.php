<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Log the request
error_log("Payment reminder request: " . $_SERVER['REQUEST_METHOD'] . " from " . ($_SERVER['HTTP_ORIGIN'] ?? 'unknown'));

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/auth_helper.php';
require_once __DIR__ . '/../../config/sns_helper.php';

// Set CORS headers first
setCorsHeaders();

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    error_log("Handling OPTIONS preflight request");
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log("Invalid method: " . $_SERVER['REQUEST_METHOD']);
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Verify landlord authentication
$auth = verifyAuth();
if (!$auth['valid'] || $auth['role'] !== 'landlord') {
    error_log("Auth failed: " . json_encode($auth));
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$landlord_id = $auth['user_data']['landlord_id'];
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['tenant_id']) || !isset($input['payment_period'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: tenant_id, payment_period']);
    exit;
}

$tenant_id = (int)$input['tenant_id'];
$payment_period = $input['payment_period']; // Format: YYYY-MM
$custom_message = $input['message'] ?? null;
$send_email = $input['send_email'] ?? true; // Default to true

try {
    $pdo = getDBConnection();
    
    // Verify tenant belongs to this landlord
    $stmt = $pdo->prepare("
        SELECT t.tenant_id, t.full_name, t.property_id, t.unit_id, u.email,
               p.property_name, pu.unit_number, p.monthly_rent
        FROM tenants t
        JOIN users u ON t.user_id = u.user_id
        JOIN properties p ON t.property_id = p.property_id
        LEFT JOIN property_units pu ON t.unit_id = pu.unit_id
        WHERE t.tenant_id = ? AND p.landlord_id = ?
    ");
    $stmt->execute([$tenant_id, $landlord_id]);
    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$tenant) {
        http_response_code(404);
        echo json_encode(['error' => 'Tenant not found or not authorized']);
        exit;
    }
    
    // Check if reminder was already sent today for this period
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM payment_reminders 
        WHERE tenant_id = ? AND payment_period = ? AND DATE(sent_at) = CURDATE()
    ");
    $stmt->execute([$tenant_id, $payment_period]);
    $today_count = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($today_count >= 3) { // Limit to 3 reminders per day
        http_response_code(429);
        echo json_encode(['error' => 'Maximum reminders sent for today. Please try again tomorrow.']);
        exit;
    }
    
    // Check payment status for this period
    $stmt = $pdo->prepare("
        SELECT status, amount 
        FROM payments 
        WHERE tenant_id = ? AND payment_period = ?
        ORDER BY created_at DESC LIMIT 1
    ");
    $stmt->execute([$tenant_id, $payment_period]);
    $payment = $stmt->fetch(PDO::FETCH_ASSOC);
    
    $reminder_type = 'manual';
    if ($payment) {
        if ($payment['status'] === 'pending' || $payment['status'] === 'overdue') {
            $reminder_type = 'overdue';
        }
    } else {
        $reminder_type = 'upcoming';
    }
    
    $notification_methods = ['system'];
    $sns_message_id = null;
    
    // Send email via SNS if requested
    if ($send_email) {
        $snsHelper = new SNSHelper();
        $emailData = [
            'tenant_name' => $tenant['full_name'],
            'tenant_email' => $tenant['email'],
            'property_name' => $tenant['property_name'],
            'unit_number' => $tenant['unit_number'],
            'payment_period' => $payment_period,
            'amount' => $tenant['monthly_rent'],
            'reminder_type' => $reminder_type
        ];
        
        $snsResult = $snsHelper->sendPaymentReminderEmail($emailData);
        
        if ($snsResult['success']) {
            $notification_methods[] = 'email';
            $sns_message_id = $snsResult['message_id'];
        } else {
            error_log("Failed to send SNS email: " . $snsResult['error']);
        }
    }
    
    // Insert reminder record
    $stmt = $pdo->prepare("
        INSERT INTO payment_reminders 
        (tenant_id, property_id, unit_id, payment_period, reminder_type, sent_by, message, notification_method, sns_message_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $tenant_id,
        $tenant['property_id'],
        $tenant['unit_id'],
        $payment_period,
        $reminder_type,
        $landlord_id,
        $custom_message,
        implode(',', $notification_methods),
        $sns_message_id
    ]);
    
    // Create system message for tenant
    $property_unit = $tenant['unit_number'] ? " Unit {$tenant['unit_number']}" : "";
    $default_message = "Reminder: Your rent payment for {$tenant['property_name']}{$property_unit} for {$payment_period} is " . 
                      ($reminder_type === 'overdue' ? 'overdue' : 'due soon') . 
                      ". Amount: RM " . number_format($tenant['monthly_rent'], 2);
    
    $final_message = $custom_message ?: $default_message;
    
    $stmt = $pdo->prepare("
        INSERT INTO system_messages 
        (property_id, unit_id, sender_id, receiver_id, message, message_type, reference_type)
        VALUES (?, ?, ?, ?, ?, 'system_payment', 'payment')
    ");
    $stmt->execute([
        $tenant['property_id'],
        $tenant['unit_id'],
        $landlord_id,
        $tenant_id,
        $final_message
    ]);
    
    // Update payment reminder_sent flag if payment exists
    if ($payment) {
        $stmt = $pdo->prepare("
            UPDATE payments 
            SET reminder_sent = 1, last_reminder_sent = NOW() 
            WHERE tenant_id = ? AND payment_period = ?
        ");
        $stmt->execute([$tenant_id, $payment_period]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Payment reminder sent successfully',
        'reminder_type' => $reminder_type,
        'tenant_name' => $tenant['full_name'],
        'notification_methods' => $notification_methods,
        'email_sent' => in_array('email', $notification_methods),
        'sent_at' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    error_log("Payment reminder error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send reminder']);
}
?>
