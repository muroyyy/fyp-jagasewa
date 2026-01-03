<?php
/**
 * Simple Rate Limiter using file-based storage
 * For production, consider using Redis for better performance
 */
class RateLimiter {
    private static $storageDir = '/tmp/rate_limits/';

    /**
     * Check if request should be rate limited
     *
     * @param string $identifier - IP address or user ID
     * @param string $endpoint - API endpoint being accessed
     * @param int $maxRequests - Maximum requests allowed in window
     * @param int $windowSeconds - Time window in seconds
     * @return array - ['allowed' => bool, 'remaining' => int, 'retry_after' => int]
     */
    public static function check($identifier, $endpoint, $maxRequests = 60, $windowSeconds = 60) {
        self::ensureStorageDir();

        $key = md5($identifier . '_' . $endpoint);
        $file = self::$storageDir . $key . '.json';

        $now = time();
        $windowStart = $now - $windowSeconds;

        // Load existing requests
        $requests = [];
        if (file_exists($file)) {
            $data = json_decode(file_get_contents($file), true);
            if (is_array($data)) {
                // Filter out expired requests
                $requests = array_filter($data, function($timestamp) use ($windowStart) {
                    return $timestamp > $windowStart;
                });
            }
        }

        $requestCount = count($requests);

        if ($requestCount >= $maxRequests) {
            // Rate limited
            $oldestRequest = min($requests);
            $retryAfter = ($oldestRequest + $windowSeconds) - $now;

            return [
                'allowed' => false,
                'remaining' => 0,
                'retry_after' => max(1, $retryAfter),
                'limit' => $maxRequests,
                'window' => $windowSeconds
            ];
        }

        // Add current request
        $requests[] = $now;
        file_put_contents($file, json_encode(array_values($requests)));

        return [
            'allowed' => true,
            'remaining' => $maxRequests - count($requests),
            'retry_after' => 0,
            'limit' => $maxRequests,
            'window' => $windowSeconds
        ];
    }

    /**
     * Apply rate limiting with automatic response headers
     * Call this at the beginning of your API endpoint
     */
    public static function enforce($endpoint, $maxRequests = 60, $windowSeconds = 60, $useUserId = false) {
        // Get identifier (IP or user ID)
        $identifier = self::getClientIP();

        // If using user ID and session exists, combine with IP
        if ($useUserId) {
            $sessionToken = self::getBearerToken();
            if ($sessionToken) {
                $identifier .= '_' . md5($sessionToken);
            }
        }

        $result = self::check($identifier, $endpoint, $maxRequests, $windowSeconds);

        // Set rate limit headers
        header('X-RateLimit-Limit: ' . $result['limit']);
        header('X-RateLimit-Remaining: ' . $result['remaining']);
        header('X-RateLimit-Window: ' . $result['window']);

        if (!$result['allowed']) {
            header('Retry-After: ' . $result['retry_after']);
            http_response_code(429);
            echo json_encode([
                'success' => false,
                'message' => 'Too many requests. Please try again later.',
                'retry_after' => $result['retry_after']
            ]);
            exit();
        }

        return $result;
    }

    /**
     * Stricter rate limiting for sensitive endpoints (login, password reset)
     */
    public static function enforceStrict($endpoint) {
        // 5 requests per minute for sensitive endpoints
        return self::enforce($endpoint, 5, 60);
    }

    /**
     * Standard rate limiting for regular API endpoints
     */
    public static function enforceStandard($endpoint) {
        // 60 requests per minute for standard endpoints
        return self::enforce($endpoint, 60, 60, true);
    }

    /**
     * Relaxed rate limiting for read-heavy endpoints
     */
    public static function enforceRelaxed($endpoint) {
        // 120 requests per minute for read endpoints
        return self::enforce($endpoint, 120, 60, true);
    }

    private static function ensureStorageDir() {
        if (!is_dir(self::$storageDir)) {
            mkdir(self::$storageDir, 0755, true);
        }
    }

    private static function getClientIP() {
        $headers = ['HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'REMOTE_ADDR'];

        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                // Handle comma-separated IPs (X-Forwarded-For)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }

    private static function getBearerToken() {
        $headers = null;

        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
                    return $matches[1];
                }
            }
        }

        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            if (preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $matches)) {
                return $matches[1];
            }
        }

        return null;
    }

    /**
     * Clean up old rate limit files (run periodically via cron)
     */
    public static function cleanup($maxAge = 3600) {
        self::ensureStorageDir();

        $files = glob(self::$storageDir . '*.json');
        $now = time();
        $cleaned = 0;

        foreach ($files as $file) {
            if (filemtime($file) < ($now - $maxAge)) {
                unlink($file);
                $cleaned++;
            }
        }

        return $cleaned;
    }
}
?>
