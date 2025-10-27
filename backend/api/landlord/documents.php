<?php
include_once '../../config/cors.php';
setCorsHeaders();


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

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

    // Get query parameters
    $category = isset($_GET['category']) ? $_GET['category'] : null;
    $propertyId = isset($_GET['property_id']) ? $_GET['property_id'] : null;
    $tenantId = isset($_GET['tenant_id']) ? $_GET['tenant_id'] : null;

    // Build query
    $query = "
        SELECT 
            d.*,
            p.property_name,
            t.full_name as tenant_name
        FROM documents d
        LEFT JOIN properties p ON d.property_id = p.property_id
        LEFT JOIN tenants t ON d.tenant_id = t.tenant_id
        WHERE d.landlord_id = ? AND d.is_active = 1
    ";
    
    $params = [$landlordId];

    if ($category && $category !== 'all') {
        $query .= " AND d.category = ?";
        $params[] = $category;
    }

    if ($propertyId) {
        $query .= " AND d.property_id = ?";
        $params[] = $propertyId;
    }

    if ($tenantId) {
        $query .= " AND d.tenant_id = ?";
        $params[] = $tenantId;
    }

    $query .= " ORDER BY d.uploaded_at DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute($params);
    $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get statistics
    $statsQuery = "
        SELECT 
            COUNT(*) as total_documents,
            SUM(CASE WHEN category = 'lease' THEN 1 ELSE 0 END) as lease_count,
            SUM(CASE WHEN category = 'invoice' THEN 1 ELSE 0 END) as invoice_count,
            SUM(CASE WHEN category = 'receipt' THEN 1 ELSE 0 END) as receipt_count,
            SUM(CASE WHEN category = 'notice' THEN 1 ELSE 0 END) as notice_count,
            SUM(CASE WHEN category = 'agreement' THEN 1 ELSE 0 END) as agreement_count,
            SUM(CASE WHEN category = 'other' THEN 1 ELSE 0 END) as other_count,
            SUM(file_size) as total_size
        FROM documents
        WHERE landlord_id = ? AND is_active = 1
    ";
    
    $statsStmt = $conn->prepare($statsQuery);
    $statsStmt->execute([$landlordId]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'documents' => $documents,
        'stats' => $stats
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>