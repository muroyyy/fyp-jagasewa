<?php
require_once __DIR__ . '/secrets.php';

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        $credentials = getDbCredentials();
        $this->host = $credentials['host'];
        $this->db_name = $credentials['dbname'];
        $this->username = $credentials['username'];
        $this->password = $credentials['password'];
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                )
            );
        } catch(PDOException $exception) {
            error_log("Database Connection Error: " . $exception->getMessage());
            throw new Exception("Database connection failed. Please try again later.");
        }
        return $this->conn;
    }
}
?>