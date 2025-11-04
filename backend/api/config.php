<?php
include_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Determine environment and API URL
$is_local = ($_SERVER['HTTP_HOST'] ?? '') === 'localhost:8000' || 
            ($_SERVER['SERVER_NAME'] ?? '') === 'localhost';

if ($is_local) {
    $api_base_url = "http://localhost:8000/api";
    $environment = 'development';
} else {
    // Production uses ALB with custom domain
    $api_base_url = "https://api.jagasewa.cloud/api";
    $environment = 'production';
}

echo json_encode([
    'api_base_url' => $api_base_url,
    'environment' => $environment,
    'server_info' => [
        'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
        'server_name' => $_SERVER['SERVER_NAME'] ?? 'unknown'
    ]
]);
?>