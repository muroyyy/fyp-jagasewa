<?php
require_once __DIR__ . '/secrets.php';

class Database {
    private $host;
    private $replica_host;
    private $db_name;
    private $username;
    private $password;
    public $conn;
    private $read_conn;

    public function __construct() {
        try {
            // Try to get credentials from AWS Secrets Manager first
            $secretName = getenv('DB_SECRET_NAME') ?: 'jagasewa-db-credentials-prod';
            $secretsManager = new SecretsManager($secretName);
            $credentials = $secretsManager->getSecret();

            $this->host = $credentials['DB_HOST'];
            $this->replica_host = $credentials['DB_REPLICA_HOST'] ?? null;
            $this->db_name = $credentials['DB_NAME'];
            $this->username = $credentials['DB_USERNAME'];
            $this->password = $credentials['DB_PASSWORD'];

        } catch (Exception $e) {
            // Fallback to environment variables
            error_log("Falling back to environment variables: " . $e->getMessage());

            $this->host = $_ENV['DB_HOST'] ?? getenv('DB_HOST');
            $this->replica_host = $_ENV['DB_REPLICA_HOST'] ?? getenv('DB_REPLICA_HOST') ?: null;
            $this->db_name = $_ENV['DB_NAME'] ?? getenv('DB_NAME');
            $this->username = $_ENV['DB_USERNAME'] ?? getenv('DB_USERNAME');
            $this->password = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD');
        }

        // Validate required credentials
        if (!$this->host || !$this->db_name || !$this->username || !$this->password) {
            throw new Exception("Database configuration missing. Check AWS Secrets Manager or environment variables.");
        }
    }

    /**
     * Get primary database connection (for writes and transactions)
     */
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
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_PERSISTENT => true
                )
            );
        } catch(PDOException $exception) {
            error_log("Database Connection Error: " . $exception->getMessage());
            throw new Exception("Database connection failed. Please try again later.");
        }
        return $this->conn;
    }

    /**
     * Get read replica connection (for read-only queries)
     * Falls back to primary if replica is not configured
     */
    public function getReadConnection() {
        // If no replica configured, use primary
        if (!$this->replica_host) {
            return $this->getConnection();
        }

        $this->read_conn = null;
        try {
            $this->read_conn = new PDO(
                "mysql:host=" . $this->replica_host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password,
                array(
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::ATTR_PERSISTENT => true
                )
            );
        } catch(PDOException $exception) {
            // If replica fails, fall back to primary
            error_log("Read Replica Connection Error, falling back to primary: " . $exception->getMessage());
            return $this->getConnection();
        }
        return $this->read_conn;
    }

    /**
     * Check if read replica is available
     */
    public function hasReadReplica() {
        return !empty($this->replica_host);
    }
}
?>