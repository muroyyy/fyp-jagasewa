<?php
function getDbCredentials() {
    $secretName = "jagasewa/production";
    $region = "ap-southeast-1";
    
    // Suppress AWS CLI pager output
    putenv('AWS_PAGER=');
    
    error_log("Attempting to retrieve database credentials from AWS Secrets Manager...");
    
    // Retrieve secret from AWS Secrets Manager
    $command = "aws secretsmanager get-secret-value --secret-id $secretName --region $region --query SecretString --output text 2>&1";
    $output = shell_exec($command);
    
    // Check if retrieval was successful
    if ($output && strpos($output, 'error') === false && strpos($output, 'Unable') === false) {
        $credentials = json_decode($output, true);
        
        if ($credentials && is_array($credentials) && isset($credentials['password'])) {
            error_log("✅ Successfully retrieved database credentials from AWS Secrets Manager");
            return $credentials;
        }
    }
    
    // Fail explicitly - no fallback
    error_log("❌ CRITICAL ERROR: Failed to retrieve database credentials from AWS Secrets Manager");
    error_log("Output: " . substr($output, 0, 200)); // Log first 200 chars for debugging
    
    throw new Exception(
        "Unable to retrieve database credentials from AWS Secrets Manager. " .
        "Please ensure: " .
        "1) EC2 instance has IAM role with secretsmanager:GetSecretValue permission " .
        "2) Secret 'jagasewa/production' exists in ap-southeast-1 " .
        "3) AWS CLI is properly installed in the container"
    );
}
?>