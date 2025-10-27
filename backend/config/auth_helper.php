<?php
/**
 * Authentication Helper Functions
 * Provides reliable methods for getting authorization headers across different environments
 */

/**
 * Get Authorization header in a reliable way across different server environments
 * @return string The authorization header value or empty string if not found
 */
function getAuthorizationHeader() {
    $authHeader = '';
    
    // Method 1: Try getallheaders() if available
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $authHeader = $headers['Authorization'];
        } elseif (isset($headers['authorization'])) {
            $authHeader = $headers['authorization'];
        }
    }
    
    // Method 2: Fallback to $_SERVER variables
    if (empty($authHeader)) {
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
    }
    
    return $authHeader;
}

/**
 * Extract Bearer token from Authorization header
 * @param string $authHeader The authorization header value
 * @return string The token or empty string if not found
 */
function extractBearerToken($authHeader) {
    if (empty($authHeader)) {
        return '';
    }
    
    // Remove "Bearer " prefix (case insensitive)
    if (stripos($authHeader, 'Bearer ') === 0) {
        return substr($authHeader, 7);
    }
    
    return '';
}

/**
 * Get Bearer token directly from request headers
 * @return string The token or empty string if not found
 */
function getBearerToken() {
    $authHeader = getAuthorizationHeader();
    return extractBearerToken($authHeader);
}
?>