<?php
/**
 * Lightweight in-memory cache for landlord data
 * TTL: 60 seconds (configurable per key)
 *
 * Usage:
 *   LandlordCache::get($landlordId, 'dashboard');
 *   LandlordCache::set($landlordId, 'dashboard', $data);
 *   LandlordCache::clear($landlordId, 'properties'); // Clear specific cache
 *   LandlordCache::clearAll($landlordId); // Clear all cache for landlord
 */
class LandlordCache {
    private static $cache = [];
    private static $defaultTtl = 60;

    // Custom TTL per cache key type (in seconds)
    private static $ttlConfig = [
        'dashboard' => 60,      // 1 minute
        'properties' => 120,    // 2 minutes
        'tenants' => 120,       // 2 minutes
        'payments' => 60,       // 1 minute
        'maintenance' => 60,    // 1 minute
        'notifications' => 30,  // 30 seconds
        'documents' => 300,     // 5 minutes
    ];

    public static function get($landlordId, $key) {
        $cacheKey = self::buildKey($landlordId, $key);

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

    public static function set($landlordId, $key, $data, $customTtl = null) {
        $cacheKey = self::buildKey($landlordId, $key);
        $ttl = $customTtl ?? (self::$ttlConfig[$key] ?? self::$defaultTtl);

        self::$cache[$cacheKey] = [
            'data' => $data,
            'expires' => time() + $ttl
        ];
    }

    /**
     * Clear specific cache key for a landlord
     * Call this when data is updated (e.g., after property update)
     */
    public static function clear($landlordId, $key) {
        $cacheKey = self::buildKey($landlordId, $key);
        unset(self::$cache[$cacheKey]);
    }

    /**
     * Clear all cache for a landlord
     * Call this for major updates that affect multiple data types
     */
    public static function clearAll($landlordId) {
        $prefix = "landlord_{$landlordId}_";
        foreach (array_keys(self::$cache) as $key) {
            if (strpos($key, $prefix) === 0) {
                unset(self::$cache[$key]);
            }
        }
    }

    /**
     * Clear specific cache key for ALL landlords
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

    private static function buildKey($landlordId, $key) {
        return "landlord_{$landlordId}_{$key}";
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
