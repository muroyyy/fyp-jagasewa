<?php
/**
 * Password Reset Model
 * Handles password reset token operations
 */

class PasswordReset {
    private $conn;
    private $table_name = "password_reset_tokens";

    // Password reset properties
    public $token_id;
    public $user_id;
    public $token;
    public $expires_at;
    public $is_used;
    public $created_at;

    /**
     * Constructor
     */
    public function __construct($db) {
        $this->conn = $db;
        // Set timezone to Malaysia
        date_default_timezone_set('Asia/Kuala_Lumpur');
    }

    /**
     * Create password reset token
     */
    public function createToken($user_id) {
        // Generate secure random token
        $token = bin2hex(random_bytes(32));
        
        // Set expiration time (1 hour from now)
        // Use time() for current Unix timestamp + 3600 seconds (1 hour)
        $expires_at = date('Y-m-d H:i:s', time() + 3600);

        $query = "INSERT INTO " . $this->table_name . "
                SET user_id = :user_id,
                    token = :token,
                    expires_at = :expires_at";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":user_id", $user_id);
        $stmt->bindParam(":token", $token);
        $stmt->bindParam(":expires_at", $expires_at);

        if($stmt->execute()) {
            $this->token = $token;
            $this->expires_at = $expires_at;
            return $token;
        }

        return false;
    }

    /**
     * Verify token validity
     */
    public function verifyToken($token) {
        $query = "SELECT token_id, user_id, expires_at, is_used
                FROM " . $this->table_name . "
                WHERE token = :token
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":token", $token);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            // Check if token is already used
            if($row['is_used']) {
                return [
                    'valid' => false,
                    'message' => 'Token has already been used'
                ];
            }

            // Check if token is expired using current timestamp
            $current_time = date('Y-m-d H:i:s');
            if($current_time > $row['expires_at']) {
                return [
                    'valid' => false,
                    'message' => 'Token has expired'
                ];
            }

            // Token is valid
            return [
                'valid' => true,
                'user_id' => $row['user_id'],
                'token_id' => $row['token_id']
            ];
        }

        return [
            'valid' => false,
            'message' => 'Invalid token'
        ];
    }

    /**
     * Mark token as used
     */
    public function markTokenAsUsed($token) {
        $query = "UPDATE " . $this->table_name . "
                SET is_used = TRUE
                WHERE token = :token";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":token", $token);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Delete expired tokens (cleanup)
     */
    public function deleteExpiredTokens() {
        $query = "DELETE FROM " . $this->table_name . "
                WHERE expires_at < NOW()";

        $stmt = $this->conn->prepare($query);

        if($stmt->execute()) {
            return $stmt->rowCount();
        }

        return 0;
    }

    /**
     * Delete all tokens for a user
     */
    public function deleteUserTokens($user_id) {
        $query = "DELETE FROM " . $this->table_name . "
                WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Get user email by token
     */
    public function getUserEmailByToken($token) {
        $query = "SELECT u.email
                FROM " . $this->table_name . " prt
                INNER JOIN users u ON prt.user_id = u.user_id
                WHERE prt.token = :token
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":token", $token);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            return $row['email'];
        }

        return false;
    }
}
?>