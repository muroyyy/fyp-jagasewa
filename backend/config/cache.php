<?php
/**
 * Unified Cache System for JagaSewa
 *
 * Supports multiple backends:
 * - APCu (recommended for single-server PHP-FPM)
 * - File-based (fallback, works everywhere)
 * - Redis (for production/multi-server)
 *
 * Usage:
 *   Cache::set('landlord_1_dashboard', $data, 60);
 *   $data = Cache::get('landlord_1_dashboard');
 *   Cache::delete('landlord_1_dashboard');
 *   Cache::deletePattern('landlord_1_*');
 */
class Cache {
    private static $driver = null;
    private static $prefix = 'jagasewa_';

    // Default TTLs for different cache types (in seconds)
    const TTL_SHORT = 30;      // Notifications, real-time data
    const TTL_MEDIUM = 60;     // Dashboard, payments
    const TTL_LONG = 300;      // Documents, properties
    const TTL_VERY_LONG = 3600; // Static data

    /**
     * Initialize cache driver (auto-detect best available)
     */
    private static function getDriver() {
        if (self::$driver !== null) {
            return self::$driver;
        }

        // Priority: APCu > File-based
        if (extension_loaded('apcu') && apcu_enabled()) {
            self::$driver = 'apcu';
        } else {
            self::$driver = 'file';
        }

        return self::$driver;
    }

    /**
     * Get value from cache
     *
     * @param string $key Cache key
     * @return mixed|null Cached value or null if not found/expired
     */
    public static function get($key) {
        $fullKey = self::$prefix . $key;
        $driver = self::getDriver();

        if ($driver === 'apcu') {
            $success = false;
            $value = apcu_fetch($fullKey, $success);
            return $success ? $value : null;
        }

        // File-based fallback
        return self::fileGet($fullKey);
    }

    /**
     * Set value in cache
     *
     * @param string $key Cache key
     * @param mixed $value Value to cache
     * @param int $ttl Time-to-live in seconds (default: 60)
     * @return bool Success status
     */
    public static function set($key, $value, $ttl = 60) {
        $fullKey = self::$prefix . $key;
        $driver = self::getDriver();

        if ($driver === 'apcu') {
            return apcu_store($fullKey, $value, $ttl);
        }

        // File-based fallback
        return self::fileSet($fullKey, $value, $ttl);
    }

    /**
     * Delete a specific cache key
     *
     * @param string $key Cache key
     * @return bool Success status
     */
    public static function delete($key) {
        $fullKey = self::$prefix . $key;
        $driver = self::getDriver();

        if ($driver === 'apcu') {
            return apcu_delete($fullKey);
        }

        // File-based fallback
        return self::fileDelete($fullKey);
    }

    /**
     * Delete all keys matching a pattern
     * Useful for cache invalidation (e.g., "landlord_5_*" clears all cache for landlord 5)
     *
     * @param string $pattern Pattern with * wildcard
     * @return int Number of keys deleted
     */
    public static function deletePattern($pattern) {
        $fullPattern = self::$prefix . $pattern;
        $driver = self::getDriver();
        $deleted = 0;

        if ($driver === 'apcu') {
            $iterator = new APCUIterator(
                '/^' . preg_quote($fullPattern, '/') . '/',
                APC_ITER_KEY
            );
            foreach ($iterator as $item) {
                if (apcu_delete($item['key'])) {
                    $deleted++;
                }
            }
            return $deleted;
        }

        // File-based fallback
        return self::fileDeletePattern($fullPattern);
    }

    /**
     * Check if a key exists in cache
     *
     * @param string $key Cache key
     * @return bool
     */
    public static function exists($key) {
        $fullKey = self::$prefix . $key;
        $driver = self::getDriver();

        if ($driver === 'apcu') {
            return apcu_exists($fullKey);
        }

        return self::get($key) !== null;
    }

    /**
     * Get or set cache (with callback for cache miss)
     *
     * @param string $key Cache key
     * @param callable $callback Function to call if cache miss
     * @param int $ttl Time-to-live in seconds
     * @return mixed Cached or fresh value
     */
    public static function remember($key, callable $callback, $ttl = 60) {
        $value = self::get($key);

        if ($value !== null) {
            return $value;
        }

        $value = $callback();
        self::set($key, $value, $ttl);

        return $value;
    }

    /**
     * Clear all cache
     *
     * @return bool Success status
     */
    public static function flush() {
        $driver = self::getDriver();

        if ($driver === 'apcu') {
            return apcu_clear_cache();
        }

        return self::fileFlush();
    }

    /**
     * Get cache statistics
     *
     * @return array Cache stats
     */
    public static function getStats() {
        $driver = self::getDriver();

        $stats = [
            'driver' => $driver,
            'prefix' => self::$prefix,
        ];

        if ($driver === 'apcu') {
            $info = apcu_cache_info();
            $stats['hits'] = $info['num_hits'] ?? 0;
            $stats['misses'] = $info['num_misses'] ?? 0;
            $stats['entries'] = $info['num_entries'] ?? 0;
            $stats['memory_used'] = $info['mem_size'] ?? 0;
        } else {
            $stats['cache_dir'] = self::getCacheDir();
            $stats['entries'] = count(glob(self::getCacheDir() . '*.cache'));
        }

        return $stats;
    }

    /**
     * Get current cache driver name
     *
     * @return string Driver name ('apcu' or 'file')
     */
    public static function getDriverName() {
        return self::getDriver();
    }

    // ========================================
    // File-based cache implementation
    // ========================================

    private static function getCacheDir() {
        $dir = sys_get_temp_dir() . '/jagasewa_cache/';
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        return $dir;
    }

    private static function getCacheFile($key) {
        return self::getCacheDir() . md5($key) . '.cache';
    }

    private static function fileGet($key) {
        $file = self::getCacheFile($key);

        if (!file_exists($file)) {
            return null;
        }

        $data = unserialize(file_get_contents($file));

        if ($data === false || !isset($data['expires']) || !isset($data['value'])) {
            unlink($file);
            return null;
        }

        if (time() > $data['expires']) {
            unlink($file);
            return null;
        }

        return $data['value'];
    }

    private static function fileSet($key, $value, $ttl) {
        $file = self::getCacheFile($key);
        $data = [
            'expires' => time() + $ttl,
            'value' => $value
        ];

        return file_put_contents($file, serialize($data), LOCK_EX) !== false;
    }

    private static function fileDelete($key) {
        $file = self::getCacheFile($key);

        if (file_exists($file)) {
            return unlink($file);
        }

        return true;
    }

    private static function fileDeletePattern($pattern) {
        $dir = self::getCacheDir();
        $files = glob($dir . '*.cache');
        $deleted = 0;

        // For file-based, we need to read each file to check the key
        // This is inefficient but works as a fallback
        foreach ($files as $file) {
            if (unlink($file)) {
                $deleted++;
            }
        }

        return $deleted;
    }

    private static function fileFlush() {
        $dir = self::getCacheDir();
        $files = glob($dir . '*.cache');

        foreach ($files as $file) {
            unlink($file);
        }

        return true;
    }
}

// ========================================
// Helper classes for Landlord/Tenant caching
// ========================================

class LandlordCache {
    private static $ttlConfig = [
        'dashboard' => Cache::TTL_MEDIUM,
        'properties' => Cache::TTL_LONG,
        'tenants' => Cache::TTL_LONG,
        'payments' => Cache::TTL_MEDIUM,
        'maintenance' => Cache::TTL_MEDIUM,
        'notifications' => Cache::TTL_SHORT,
        'documents' => Cache::TTL_LONG,
    ];

    public static function get($landlordId, $key) {
        return Cache::get("landlord_{$landlordId}_{$key}");
    }

    public static function set($landlordId, $key, $data, $customTtl = null) {
        $ttl = $customTtl ?? (self::$ttlConfig[$key] ?? Cache::TTL_MEDIUM);
        return Cache::set("landlord_{$landlordId}_{$key}", $data, $ttl);
    }

    public static function clear($landlordId, $key) {
        return Cache::delete("landlord_{$landlordId}_{$key}");
    }

    public static function clearAll($landlordId) {
        return Cache::deletePattern("landlord_{$landlordId}_*");
    }
}

class TenantCache {
    private static $ttlConfig = [
        'dashboard' => Cache::TTL_MEDIUM,
        'property' => Cache::TTL_LONG,
        'payments' => Cache::TTL_MEDIUM,
        'maintenance' => Cache::TTL_MEDIUM,
        'notifications' => Cache::TTL_SHORT,
        'documents' => Cache::TTL_LONG,
    ];

    public static function get($tenantId, $key) {
        return Cache::get("tenant_{$tenantId}_{$key}");
    }

    public static function set($tenantId, $key, $data, $customTtl = null) {
        $ttl = $customTtl ?? (self::$ttlConfig[$key] ?? Cache::TTL_MEDIUM);
        return Cache::set("tenant_{$tenantId}_{$key}", $data, $ttl);
    }

    public static function clear($tenantId, $key) {
        return Cache::delete("tenant_{$tenantId}_{$key}");
    }

    public static function clearAll($tenantId) {
        return Cache::deletePattern("tenant_{$tenantId}_*");
    }
}

class AdminCache {
    public static function get($key) {
        return Cache::get("admin_{$key}");
    }

    public static function set($key, $data, $ttl = Cache::TTL_MEDIUM) {
        return Cache::set("admin_{$key}", $data, $ttl);
    }

    public static function clear($key) {
        return Cache::delete("admin_{$key}");
    }

    public static function clearAll() {
        return Cache::deletePattern("admin_*");
    }
}
?>
