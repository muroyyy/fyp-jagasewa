<?php
function setCorsHeaders() {
    $allowed_origins = [
        'http://localhost:5173',        // Development
        'http://54.179.253.183'          // Production EC2 (frontend on port 80)
    ];
    
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, $allowed_origins) || in_array('*', $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header("Content-Type: application/json; charset=UTF-8");
    header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
    header("Access-Control-Max-Age: 3600");
    header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
}
?>