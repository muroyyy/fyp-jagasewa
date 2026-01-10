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
require_once '../../config/tenant_cache.php';

$token = getBearerToken();

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();           // Primary for session verification
    $readConn = $database->getReadConnection();   // Replica for read-only queries

    // Verify session token
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role, t.tenant_id, t.property_id
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
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or expired session'
        ]);
        exit();
    }

    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $tenant_id = $session['tenant_id'];
    $property_id = $session['property_id'];

    // Check cache first
    $cachedDocuments = TenantCache::get($tenant_id, 'documents');
    
    if ($cachedDocuments !== null) {
        $documents = $cachedDocuments;
    } else {
        // Get all documents for this tenant's property (using read replica)
        $stmt = $readConn->prepare("
            SELECT 
                d.document_id,
                d.file_name,
                d.file_path,
                d.file_type,
                d.file_size,
                d.category,
                d.description,
                d.uploaded_at,
                p.property_name
            FROM documents d
            LEFT JOIN properties p ON d.property_id = p.property_id
            WHERE (d.tenant_id = :tenant_id OR d.property_id = :property_id)
            AND d.is_active = 1
            ORDER BY d.uploaded_at DESC
        ");
        $stmt->bindParam(':tenant_id', $tenant_id);
        $stmt->bindParam(':property_id', $property_id);
        $stmt->execute();

        $documents = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Generate secure URLs for each document
        foreach ($documents as &$doc) {
            if (strpos($doc['file_path'], 'https://') === 0) {
                $s3Key = str_replace('https://jagasewa-assets-prod.s3.ap-southeast-1.amazonaws.com/', '', $doc['file_path']);
                $doc['file_url'] = generatePresignedUrl($s3Key, 60);
            } else {
                $doc['file_url'] = 'http://localhost:8000/' . $doc['file_path'];
            }
        }
        
        // Cache the results
        TenantCache::set($tenant_id, 'documents', $documents);
    }

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Documents retrieved successfully',
        'data' => [
            'documents' => $documents
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>