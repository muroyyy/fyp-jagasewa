<?php
require_once '../config/cors.php';
setCorsHeaders();

echo json_encode([
    'method' => $_SERVER['REQUEST_METHOD'],
    'php_version' => phpversion(),
    'vendor_exists' => file_exists('../vendor/autoload.php'),
    'aws_sdk_test' => 'checking...'
]);

if (file_exists('../vendor/autoload.php')) {
    try {
        require_once '../vendor/autoload.php';
        echo json_encode(['autoload' => 'success']);
        
        if (class_exists('Aws\Translate\TranslateClient')) {
            echo json_encode(['aws_translate_class' => 'found']);
        } else {
            echo json_encode(['aws_translate_class' => 'not_found']);
        }
    } catch (Exception $e) {
        echo json_encode(['autoload_error' => $e->getMessage()]);
    }
}
?>