<?php
include_once '../config/cors.php';
setCorsHeaders();

// backend/api/health.php

$response = [
    'status' => 'healthy',
    'service' => 'jagasewa-backend',
    'timestamp' => date('Y-m-d H:i:s'),
    'deployment' => 'v2.2-' . date('YmdHis'),
    'trigger' => 'single-ec2-deployment-' . time(),
    'php_version' => phpversion(),
];

// Optional: Check database connection
try {
    require_once __DIR__ . '/../config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    $response['database'] = 'connected';
} catch (Exception $e) {
    $response['database'] = 'disconnected: ' . $e->getMessage();
    $response['status'] = 'degraded';
}

// Check APCu cache status
$response['cache'] = [
    'apcu_enabled' => extension_loaded('apcu') && apcu_enabled(),
    'opcache_enabled' => function_exists('opcache_get_status') && opcache_get_status() !== false,
];

if ($response['cache']['apcu_enabled']) {
    $apcuInfo = apcu_cache_info(true);
    $response['cache']['apcu_stats'] = [
        'memory_size' => $apcuInfo['mem_size'] ?? 0,
        'num_entries' => $apcuInfo['num_entries'] ?? 0,
        'hits' => $apcuInfo['num_hits'] ?? 0,
        'misses' => $apcuInfo['num_misses'] ?? 0,
    ];
}

http_response_code(200);
echo json_encode($response);