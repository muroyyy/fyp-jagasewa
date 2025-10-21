#!/bin/bash

# Fetch secrets and build with environment variables
SECRET_ARN="arn:aws:secretsmanager:ap-southeast-1:007027391333:secret:jagasewa/production-jcMA6T"

# Get EC2 IP from secrets manager
EC2_IP=$(aws secretsmanager get-secret-value \
    --secret-id "$SECRET_ARN" \
    --region ap-southeast-1 \
    --query 'SecretString' \
    --output text | jq -r '.EC2_PUBLIC_IP')

# Create production env file with actual IP
echo "VITE_API_URL=http://$EC2_IP:8000/api" > frontend/.env.production

# Update CORS configuration - reset first, then update
cp backend/config/cors.php.template backend/config/cors.php 2>/dev/null || true
sed -i "s/EC2_PUBLIC_IP/$EC2_IP/g" backend/config/cors.php

echo "Configuration updated with EC2 IP: $EC2_IP"