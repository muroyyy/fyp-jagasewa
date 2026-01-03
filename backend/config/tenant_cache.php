<?php
/**
 * Lightweight in-memory cache for tenant data
 * TTL: 60 seconds (configurable per key)
 *
 * Usage:
 *   TenantCache::get($tenantId, 'dashboard');
 *   TenantCache::set($tenantId, 'dashboard', $data);
 *   TenantCache::clear($tenantId, 'payments'); // Clear specific cache
 *   TenantCache::clearAll($tenantId); // Clear all cache for tenant
 */
class TenantCache {
    private static $cache = [];
    private static $defaultTtl = 60;

    // Custom TTL per cache key type (in seconds)
    private static $ttlConfig = [
        'dashboard' => 60,      // 1 minute
        'property' => 300,      // 5 minutes (rarely changes)
        'payments' => 60,       // 1 minute
        'maintenance' => 60,    // 1 minute
        'notifications' => 30,  // 30 seconds
        'documents' => 300,     // 5 minutes
    ];

    public static function get($tenantId, $key) {
        $cacheKey = self::buildKey($tenantId, $key);

        if (!isset(self::$cache[$cacheKey])) {
            return null;
        }

        $cached = self::$cache[$cacheKey];

        if (time() > $cached['expires']) {
            unset(self::$cache[$cacheKey]);
            return null;
        }

        return $cached['data'];
    }

    public static function set($tenantId, $key, $data, $customTtl = null) {
        $cacheKey = self::buildKey($tenantId, $key);
        $ttl = $customTtl ?? (self::$ttlConfig[$key] ?? self::$defaultTtl);

        self::$cache[$cacheKey] = [
            'data' => $data,
            'expires' => time() + $ttl
        ];
    }

    /**
     * Clear specific cache key for a tenant
     * Call this when data is updated (e.g., after payment)
     */
    public static function clear($tenantId, $key) {
        $cacheKey = self::buildKey($tenantId, $key);
        unset(self::$cache[$cacheKey]);
    }

    /**
     * Clear all cache for a tenant
     * Call this for major updates that affect multiple data types
     */
    public static function clearAll($tenantId) {
        $prefix = "tenant_{$tenantId}_";
        foreach (array_keys(self::$cache) as $key) {
            if (strpos($key, $prefix) === 0) {
                unset(self::$cache[$key]);
            }
        }
    }

    /**
     * Clear specific cache key for ALL tenants
     * Useful when admin makes system-wide changes
     */
    public static function clearGlobal($key) {
        $suffix = "_{$key}";
        foreach (array_keys(self::$cache) as $cacheKey) {
            if (substr($cacheKey, -strlen($suffix)) === $suffix) {
                unset(self::$cache[$cacheKey]);
            }
        }
    }

    private static function buildKey($tenantId, $key) {
        return "tenant_{$tenantId}_{$key}";
    }

    /**
     * Get cache statistics (for debugging)
     */
    public static function getStats() {
        $stats = [
            'total_keys' => count(self::$cache),
            'keys' => []
        ];

        foreach (self::$cache as $key => $value) {
            $stats['keys'][$key] = [
                'expires_in' => max(0, $value['expires'] - time()),
                'size' => strlen(serialize($value['data']))
            ];
        }

        return $stats;
    }
}
?>
