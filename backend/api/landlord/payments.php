<?php
include_once '../../config/cors.php';
setCorsHeaders();


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/landlord_cache.php';

// Get authorization token using helper function
$sessionToken = getBearerToken();

if (empty($sessionToken)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();

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

    // Check cache first
    $cachedPayments = LandlordCache::get($landlordId, 'payments');
    
    if ($cachedPayments !== null) {
        $payments = $cachedPayments;
    } else {
        // Fetch all payments for this landlord's properties
        $stmt = $conn->prepare("
            SELECT 
                p.payment_id,
                p.amount,
                p.payment_method,
                p.payment_provider,
                p.transaction_id,
                p.status,
                p.payment_date,
                p.created_at,
                t.full_name as tenant_name,
                t.tenant_id,
                pr.property_name,
                pr.property_id
            FROM payments p
            JOIN tenants t ON p.tenant_id = t.tenant_id
            JOIN properties pr ON p.property_id = pr.property_id
            WHERE pr.landlord_id = ?
            ORDER BY p.payment_date DESC, p.created_at DESC
        ");
        $stmt->execute([$landlordId]);
        $payments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Cache the results
        LandlordCache::set($landlordId, 'payments', $payments);
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'payments' => $payments,
            'total_count' => count($payments)
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