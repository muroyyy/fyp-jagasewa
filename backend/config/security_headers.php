<?php
/**
 * Security Headers Configuration
 * Apply HTTP security headers to all API responses
 */

function setSecurityHeaders() {
    // Strict Transport Security
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    
    // Content Security Policy
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://jagasewa.cloud;");
    
    // X-Content-Type-Options
    header('X-Content-Type-Options: nosniff');
    
    // X-Frame-Options
    header('X-Frame-Options: DENY');
    
    // X-XSS-Protection
    header('X-XSS-Protection: 1; mode=block');
    
    // Referrer Policy
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // Permissions Policy
    header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
}
?>