<?php
/**
 * Database Configuration
 * JagaSewa Property Management System
 */

class Database {
    private $host = "localhost";
    private $db_name = "jagasewa_db";
    private $username = "root";
    private $password = "";
    private $conn;

    /**
     * Get database connection
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            
            // Set charset to UTF-8
            $this->conn->exec("set names utf8mb4");
            
            // Set error mode to exception
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Return associative arrays by default
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}
?>