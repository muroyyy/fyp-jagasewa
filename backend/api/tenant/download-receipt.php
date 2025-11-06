<?php
include_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/s3_helper.php';

// Try to get token from multiple sources
$token = getBearerToken();

if (empty($token) && isset($_GET['token'])) {
    $token = $_GET['token'];
}

if (empty($token) && isset($_COOKIE['session_token'])) {
    $token = $_COOKIE['session_token'];
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Verify session token
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role, t.tenant_id
        FROM sessions s
        JOIN tenants t ON s.user_id = t.user_id
        WHERE s.session_token = :token 
        AND s.expires_at > NOW()
        AND s.user_role = 'tenant'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid or expired session']);
        exit();
    }

    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $tenant_id = $session['tenant_id'];

    // Get payment ID from query parameter
    $payment_id = $_GET['payment_id'] ?? null;
    
    if (!$payment_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Payment ID required']);
        exit();
    }

    // Get payment details and verify access
    $stmt = $conn->prepare("
        SELECT 
            p.payment_id,
            p.transaction_id,
            p.receipt_url
        FROM payments p
        WHERE p.payment_id = :payment_id
        AND p.tenant_id = :tenant_id
    ");
    $stmt->bindParam(':payment_id', $payment_id);
    $stmt->bindParam(':tenant_id', $tenant_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Receipt not found or access denied']);
        exit();
    }

    $payment = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment['receipt_url']) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Receipt not available']);
        exit();
    }

    if (strpos($payment['receipt_url'], 'https://') === 0) {
        // S3 file - redirect to pre-signed URL
        $s3Key = str_replace('https://jagasewa-assets-prod.s3.ap-southeast-1.amazonaws.com/', '', $payment['receipt_url']);
        $presignedUrl = generatePresignedUrl($s3Key, 60);
        
        if ($presignedUrl) {
            header('Location: ' . $presignedUrl);
            exit();
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to generate download URL']);
            exit();
        }
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Receipt file not found']);
        exit();
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>