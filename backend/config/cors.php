<?php
function setCorsHeaders() {
    $allowed_origins = [
        'https://jagasewa.cloud',      // Production (frontend)
        'https://api.jagasewa.cloud',  // Production (backend)
        'https://dev.jagasewa.cloud'   // Staging
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Vary: Origin");
    } else {
        // For Safari compatibility, don't set credentials with wildcard-like behavior
        header("Access-Control-Allow-Origin: https://jagasewa.cloud");
        header("Vary: Origin");
    }

    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
    header("Access-Control-Max-Age: 86400");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin");
    header("Access-Control-Allow-Credentials: true");

    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}
?>