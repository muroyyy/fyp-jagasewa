<?php
require_once '../config/cors.php';
setCorsHeaders();

// Log all errors to see what's happening
ini_set('display_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Only POST allowed']);
    exit;
}

// Test 1: Can we get POST data?
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['error' => 'No POST data received']);
    exit;
}

// Test 2: Return the input back
echo json_encode([
    'success' => true,
    'received' => $input,
    'message' => 'POST data received successfully'
]);
?>