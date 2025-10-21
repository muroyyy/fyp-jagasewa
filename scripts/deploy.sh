#!/bin/bash
set -e  # Exit on any error

echo "======================================"
echo "JagaSewa Deployment Script"
echo "======================================"

# Configuration
SECRET_NAME="jagasewa/production"
REGION="ap-southeast-1"

# Retrieve secrets from AWS Secrets Manager
echo "🔐 Retrieving secrets from AWS Secrets Manager..."
SECRET_JSON=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_NAME" \
  --region "$REGION" \
  --query SecretString \
  --output text)

if [ -z "$SECRET_JSON" ]; then
    echo "❌ Failed to retrieve secrets from Secrets Manager"
    exit 1
fi

echo "✅ Secrets retrieved successfully"

# Parse secrets and export as environment variables
export ECR_REGISTRY=$(echo $SECRET_JSON | jq -r '.ECR_REGISTRY')
export IMAGE_TAG=$(echo $SECRET_JSON | jq -r '.IMAGE_TAG // "latest"')
export DB_HOST=$(echo $SECRET_JSON | jq -r '.DB_HOST')
export DB_NAME=$(echo $SECRET_JSON | jq -r '.DB_NAME')
export DB_USER=$(echo $SECRET_JSON | jq -r '.DB_USER')
export DB_PASSWORD=$(echo $SECRET_JSON | jq -r '.DB_PASSWORD')
export EC2_PUBLIC_IP=$(echo $SECRET_JSON | jq -r '.EC2_PUBLIC_IP')
export APP_ENV=$(echo $SECRET_JSON | jq -r '.APP_ENV // "production"')

# Validate required variables
if [ -z "$ECR_REGISTRY" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ]; then
    echo "❌ Missing required secrets!"
    exit 1
fi

echo "✅ Environment variables loaded"

# Authenticate with ECR
echo "🔐 Authenticating with ECR..."
aws ecr get-login-password --region $REGION | \
    docker login --username AWS --password-stdin $ECR_REGISTRY
echo "✅ ECR authentication successful"

# Pull latest images
echo "⬇️ Pulling latest images..."
docker pull $ECR_REGISTRY/jagasewa-frontend:${IMAGE_TAG}
docker pull $ECR_REGISTRY/jagasewa-backend:${IMAGE_TAG}
echo "✅ Images pulled successfully"

# Navigate to app directory
cd /home/ubuntu/jagasewa

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
echo "✅ Old containers stopped"

# Start new containers
echo "🚀 Starting new containers..."
docker-compose -f docker-compose.prod.yml up -d
echo "✅ New containers started"

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 15

# Health checks
echo "🏥 Running health checks..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "⚠️ Frontend health check failed"
fi

if curl -f http://localhost:8000/api/health.php > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "⚠️ Backend health check failed"
fi

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -af --filter "until=24h"
echo "✅ Cleanup complete"

# Show running containers
echo "📊 Currently running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "======================================"
echo "✅ Deployment Complete!"
echo "======================================"