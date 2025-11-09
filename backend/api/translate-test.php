<?php
require_once '../config/cors.php';
setCorsHeaders();

// Test 1: Basic response
echo json_encode(['test' => 'basic', 'status' => 'working']);

// Test 2: Check if vendor exists
if (!file_exists('../vendor/autoload.php')) {
    echo json_encode(['error' => 'vendor/autoload.php not found']);
    exit;
}

// Test 3: Try to load autoload
try {
    require_once '../vendor/autoload.php';
    echo json_encode(['autoload' => 'loaded']);
} catch (Exception $e) {
    echo json_encode(['autoload_error' => $e->getMessage()]);
    exit;
}

// Test 4: Check AWS SDK
if (!class_exists('Aws\Translate\TranslateClient')) {
    echo json_encode(['aws_sdk' => 'TranslateClient class not found']);
    exit;
}

echo json_encode(['all_tests' => 'passed']);
?>