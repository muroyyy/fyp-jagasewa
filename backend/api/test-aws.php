<?php
header("Content-Type: text/plain");

echo "=== AWS CLI Test ===\n";

// Test 1: Check if AWS CLI is installed
echo "1. AWS CLI Version:\n";
$awsVersion = shell_exec("aws --version 2>&1");
echo $awsVersion . "\n";

// Test 2: Check AWS credentials
echo "2. AWS Identity:\n";
$identity = shell_exec("aws sts get-caller-identity 2>&1");
echo $identity . "\n";

// Test 3: Test Secrets Manager access
echo "3. Secrets Manager Test:\n";
$secret = shell_exec("aws secretsmanager get-secret-value --secret-id jagasewa/production --region ap-southeast-1 2>&1");
echo substr($secret, 0, 200) . "\n";

// Test 4: Environment variables
echo "4. Environment Variables:\n";
echo "AWS_DEFAULT_REGION: " . ($_ENV['AWS_DEFAULT_REGION'] ?? 'not set') . "\n";
echo "AWS_REGION: " . ($_ENV['AWS_REGION'] ?? 'not set') . "\n";
?>