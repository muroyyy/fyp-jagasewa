<?php
function getDbCredentials() {
    $secretName = "jagasewa/db/credentials";
    $region = "ap-southeast-1";
    
    // Use AWS CLI to get secret (requires AWS CLI installed in container)
    $command = "aws secretsmanager get-secret-value --secret-id $secretName --region $region --query SecretString --output text 2>&1";
    $output = shell_exec($command);
    
    if ($output) {
        $credentials = json_decode($output, true);
        if ($credentials) {
            return $credentials;
        }
    }
    
    // Fallback to environment variables
    return [
        'host' => getenv('DB_HOST') ?: '172.17.0.1',
        'dbname' => getenv('DB_NAME') ?: 'jagasewa_db',
        'username' => getenv('DB_USER') ?: 'jagasewa_user',
        'password' => getenv('DB_PASSWORD') ?: ''
    ];
}
?>