<?php
require_once '../config/cors.php';
setCorsHeaders();

echo json_encode([
    'method' => $_SERVER['REQUEST_METHOD'],
    'php_version' => phpversion(),
    'vendor_exists' => file_exists('../vendor/autoload.php')
]);

if (file_exists('../vendor/autoload.php')) {
    try {
        require_once '../vendor/autoload.php';
        echo json_encode(['autoload' => 'success']);
    } catch (Exception $e) {
        echo json_encode(['autoload_error' => $e->getMessage()]);
    }
}
?>