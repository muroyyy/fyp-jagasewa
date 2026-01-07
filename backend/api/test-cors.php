<?php
require_once 'config/cors.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    echo json_encode([
        'success' => true,
        'message' => 'CORS test successful',
        'method' => $_SERVER['REQUEST_METHOD'],
        'origin' => $_SERVER['HTTP_ORIGIN'] ?? 'none'
    ]);
} else {
    echo json_encode([
        'success' => true,
        'message' => 'CORS test endpoint',
        'method' => $_SERVER['REQUEST_METHOD']
    ]);
}
?>