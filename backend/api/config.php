<?php
include_once '../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get server's public IP (this will be the EC2 IP when deployed)
$server_ip = $_SERVER['SERVER_ADDR'] ?? 'localhost';

// For production, use the actual server IP
$api_base_url = "http://$server_ip:8000/api";

// If running locally, use localhost
if ($server_ip === '127.0.0.1' || $server_ip === 'localhost') {
    $api_base_url = "http://localhost:8000/api";
}

echo json_encode([
    'api_base_url' => $api_base_url,
    'environment' => $server_ip === 'localhost' ? 'development' : 'production'
]);
?>