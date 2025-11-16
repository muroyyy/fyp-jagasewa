<?php
class SecretsManager {
    private $region;
    private $secretName;
    
    public function __construct($secretName, $region = 'ap-southeast-1') {
        $this->secretName = $secretName;
        $this->region = $region;
    }
    
    public function getSecret() {
        try {
            // Use AWS CLI to get secret (requires AWS CLI installed on EC2)
            $command = "aws secretsmanager get-secret-value --secret-id {$this->secretName} --region {$this->region} --output json";
            $output = shell_exec($command);
            
            if (!$output) {
                throw new Exception("Failed to retrieve secret from AWS Secrets Manager");
            }
            
            $result = json_decode($output, true);
            
            if (!isset($result['SecretString'])) {
                throw new Exception("Secret string not found in response");
            }
            
            $secret = json_decode($result['SecretString'], true);
            
            // Normalize keys to uppercase format expected by Database class
            return [
                'DB_HOST' => $secret['host'] ?? $secret['DB_HOST'] ?? null,
                'DB_NAME' => $secret['dbname'] ?? $secret['DB_NAME'] ?? null,
                'DB_USERNAME' => $secret['username'] ?? $secret['DB_USERNAME'] ?? null,
                'DB_PASSWORD' => $secret['password'] ?? $secret['DB_PASSWORD'] ?? null
            ];
            
        } catch (Exception $e) {
            error_log("Secrets Manager Error: " . $e->getMessage());
            throw new Exception("Failed to retrieve database credentials");
        }
    }
}
?>