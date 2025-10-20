<?php
// backend/api/health.php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$response = [
    'status' => 'healthy',
    'service' => 'jagasewa-backend',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
];

// Optional: Check database connection
try {
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    $response['database'] = 'connected';
} catch (Exception $e) {
    $response['database'] = 'disconnected';
    $response['status'] = 'degraded';
}

http_response_code(200);
echo json_stringify($response);