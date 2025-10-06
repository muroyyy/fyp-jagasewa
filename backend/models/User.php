<?php
/**
 * User Model
 * Handles user authentication and user-related operations
 */

class User {
    private $conn;
    private $table_name = "users";

    // User properties
    public $user_id;
    public $email;
    public $password_hash;
    public $user_role;
    public $is_active;
    public $is_verified;
    public $verification_token;
    public $created_at;
    public $updated_at;

    /**
     * Constructor
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Register new user
     */
    public function register() {
        $query = "INSERT INTO " . $this->table_name . "
                SET email = :email,
                    password_hash = :password_hash,
                    user_role = :user_role,
                    is_verified = :is_verified,
                    verification_token = :verification_token";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->user_role = htmlspecialchars(strip_tags($this->user_role));

        // Hash password
        $password_hash = password_hash($this->password_hash, PASSWORD_BCRYPT);

        // Generate verification token
        $verification_token = bin2hex(random_bytes(32));
        
        // Convert boolean to integer (0 or 1)
        $is_verified = $this->is_verified ? 1 : 0;

        // Bind values
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $password_hash);
        $stmt->bindParam(":user_role", $this->user_role);
        $stmt->bindParam(":is_verified", $is_verified, PDO::PARAM_INT);
        $stmt->bindParam(":verification_token", $verification_token);

        if($stmt->execute()) {
            $this->user_id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Login user
     */
    public function login() {
        $query = "SELECT user_id, email, password_hash, user_role, is_active, is_verified
                FROM " . $this->table_name . "
                WHERE email = :email
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            // Check if account is active
            if(!$row['is_active']) {
                return ['success' => false, 'message' => 'Account is deactivated'];
            }

            // Verify password
            if(password_verify($this->password_hash, $row['password_hash'])) {
                $this->user_id = $row['user_id'];
                $this->user_role = $row['user_role'];
                $this->is_verified = $row['is_verified'];
                
                return [
                    'success' => true,
                    'user_id' => $row['user_id'],
                    'email' => $row['email'],
                    'user_role' => $row['user_role'],
                    'is_verified' => $row['is_verified']
                ];
            } else {
                return ['success' => false, 'message' => 'Invalid password'];
            }
        }

        return ['success' => false, 'message' => 'User not found'];
    }

    /**
     * Check if email exists
     */
    public function emailExists() {
        $query = "SELECT user_id, email FROM " . $this->table_name . "
                WHERE email = :email LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $this->email);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->user_id = $row['user_id'];
            return true;
        }

        return false;
    }

    /**
     * Get user by ID
     */
    public function getUserById($user_id) {
        $query = "SELECT * FROM " . $this->table_name . "
                WHERE user_id = :user_id LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return false;
    }

    /**
     * Update user
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET email = :email,
                    is_active = :is_active,
                    is_verified = :is_verified
                WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);

        $this->email = htmlspecialchars(strip_tags($this->email));

        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":is_active", $this->is_active);
        $stmt->bindParam(":is_verified", $this->is_verified);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Update password
     */
    public function updatePassword($new_password) {
        $query = "UPDATE " . $this->table_name . "
                SET password_hash = :password_hash
                WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);

        $password_hash = password_hash($new_password, PASSWORD_BCRYPT);

        $stmt->bindParam(":password_hash", $password_hash);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Verify email
     */
    public function verifyEmail($token) {
        $query = "UPDATE " . $this->table_name . "
                SET is_verified = TRUE,
                    verification_token = NULL
                WHERE verification_token = :token";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":token", $token);

        if($stmt->execute() && $stmt->rowCount() > 0) {
            return true;
        }

        return false;
    }

    /**
     * Deactivate user
     */
    public function deactivate() {
        $query = "UPDATE " . $this->table_name . "
                SET is_active = FALSE
                WHERE user_id = :user_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $this->user_id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }
}
?>