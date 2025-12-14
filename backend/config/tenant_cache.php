<?php
/**
 * Lightweight in-memory cache for tenant data
 * TTL: 60 seconds
 */
class TenantCache {
    private static $cache = [];
    private static $ttl = 60;
    
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
    
    public static function set($tenantId, $key, $data) {
        $cacheKey = self::buildKey($tenantId, $key);
        self::$cache[$cacheKey] = [
            'data' => $data,
            'expires' => time() + self::$ttl
        ];
    }
    
    private static function buildKey($tenantId, $key) {
        return "tenant_{$tenantId}_{$key}";
    }
}
?>
