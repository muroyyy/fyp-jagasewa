#!/bin/bash

# Fetch EC2 public IP from AWS Secrets Manager and update configuration
SECRET_NAME="jagasewa/production"
REGION="ap-southeast-1"  

echo "Fetching EC2 public IP from AWS Secrets Manager..."

# Get EC2 public IP from secrets manager
EC2_IP=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_NAME" \
    --region "$REGION" \
    --query 'SecretString' \
    --output text | jq -r '.ec2_public_ip')

if [ "$EC2_IP" = "null" ] || [ -z "$EC2_IP" ]; then
    echo "Error: Could not retrieve EC2 public IP from Secrets Manager"
    exit 1
fi

echo "EC2 Public IP: $EC2_IP"

# Update frontend environment file
sed -i "s/EC2_PUBLIC_IP/$EC2_IP/g" frontend/.env.production

# Update backend CORS configuration
sed -i "s/EC2_PUBLIC_IP/$EC2_IP/g" backend/config/cors.php

echo "Configuration updated successfully!"