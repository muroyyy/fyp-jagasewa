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

/**
 * Verify session token with sliding expiration and return user data
 * @param string $token The session token
 * @return array|false User data array or false if invalid
 */
function verifyJWT($token) {
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        // Verify token in sessions table
        $query = "SELECT s.session_id, s.user_id, s.user_role, u.email, s.expires_at
                  FROM sessions s 
                  JOIN users u ON s.user_id = u.user_id 
                  WHERE s.session_token = :token AND s.expires_at > NOW()";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->execute();
        
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($session) {
            // Implement sliding expiration - extend session by 2 hours on activity
            $new_expiry = date('Y-m-d H:i:s', strtotime('+2 hours'));
            $update_query = "UPDATE sessions SET expires_at = :new_expiry, last_activity = NOW() WHERE session_id = :session_id";
            $update_stmt = $db->prepare($update_query);
            $update_stmt->bindParam(':new_expiry', $new_expiry);
            $update_stmt->bindParam(':session_id', $session['session_id']);
            $update_stmt->execute();
            
            // Get full name from landlords, tenants, or admins table based on role
            $full_name = '';
            if ($session['user_role'] === 'landlord') {
                $name_query = "SELECT full_name FROM landlords WHERE user_id = :user_id";
            } elseif ($session['user_role'] === 'tenant') {
                $name_query = "SELECT full_name FROM tenants WHERE user_id = :user_id";
            } elseif ($session['user_role'] === 'admin') {
                $name_query = "SELECT full_name FROM admins WHERE user_id = :user_id";
            }
            
            if (isset($name_query)) {
                $name_stmt = $db->prepare($name_query);
                $name_stmt->bindParam(':user_id', $session['user_id']);
                $name_stmt->execute();
                $name_result = $name_stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($name_result) {
                    $full_name = $name_result['full_name'];
                }
            }
            
            return [
                'user_id' => $session['user_id'],
                'role' => $session['user_role'],
                'email' => $session['email'],
                'full_name' => $full_name
            ];
        }
        
        return false;
        
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Generate refresh token
 * @return string 64-character refresh token
 */
function generateRefreshToken() {
    return bin2hex(random_bytes(32));
}

/**
 * Invalidate all sessions for a user (logout)
 * @param int $user_id User ID
 * @return bool Success status
 */
function invalidateUserSessions($user_id) {
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        $query = "UPDATE sessions SET expires_at = NOW() WHERE user_id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        return $stmt->execute();
        
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Clean expired sessions (run periodically)
 * @return int Number of sessions cleaned
 */
function cleanExpiredSessions() {
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        $query = "DELETE FROM sessions WHERE expires_at <= NOW()";
        $stmt = $db->prepare($query);
        $stmt->execute();
        return $stmt->rowCount();
        
    } catch (Exception $e) {
        return 0;
    }
}
?>