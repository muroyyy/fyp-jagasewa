<?php
/**
 * Lightweight in-memory cache for landlord data
 * TTL: 60 seconds
 */
class LandlordCache {
    private static $cache = [];
    private static $ttl = 60;
    
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
    
    public static function set($landlordId, $key, $data) {
        $cacheKey = self::buildKey($landlordId, $key);
        self::$cache[$cacheKey] = [
            'data' => $data,
            'expires' => time() + self::$ttl
        ];
    }
    
    private static function buildKey($landlordId, $key) {
        return "landlord_{$landlordId}_{$key}";
    }
}
?>
