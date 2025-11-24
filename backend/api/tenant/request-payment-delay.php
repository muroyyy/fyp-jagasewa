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
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['request_type']) || !isset($input['reason'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Request type and reason are required']);
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
    
    $paymentPeriod = $input['payment_period'] ?? date('Y-m');
    
    // Insert payment request
    $insertStmt = $db->prepare("
        INSERT INTO payment_requests (tenant_id, property_id, request_type, payment_period, reason)
        VALUES (:tenant_id, :property_id, :request_type, :payment_period, :reason)
    ");
    $insertStmt->bindParam(':tenant_id', $tenant['tenant_id']);
    $insertStmt->bindParam(':property_id', $tenant['property_id']);
    $insertStmt->bindParam(':request_type', $input['request_type']);
    $insertStmt->bindParam(':payment_period', $paymentPeriod);
    $insertStmt->bindParam(':reason', $input['reason']);
    $insertStmt->execute();
    
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Payment request submitted successfully. Waiting for landlord approval.',
        'request_id' => $db->lastInsertId()
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
