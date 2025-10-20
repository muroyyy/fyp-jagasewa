# scripts/deploy.sh
#!/bin/bash
set -e  # Exit on any error

echo "======================================"
echo "JagaSewa Deployment Script"
echo "======================================"

# Load environment variables
if [ -f /home/ubuntu/jagasewa/.env ]; then
    source /home/ubuntu/jagasewa/.env
    echo "✅ Environment variables loaded"
else
    echo "❌ .env file not found!"
    exit 1
fi

# Authenticate with ECR
echo "🔐 Authenticating with ECR..."
aws ecr get-login-password --region ap-southeast-1 | \
    docker login --username AWS --password-stdin $ECR_REGISTRY
echo "✅ ECR authentication successful"

# Pull latest images
echo "⬇️ Pulling latest images..."
docker pull $ECR_REGISTRY/jagasewa-frontend:${IMAGE_TAG:-latest}
docker pull $ECR_REGISTRY/jagasewa-backend:${IMAGE_TAG:-latest}
echo "✅ Images pulled successfully"

# Navigate to app directory
cd /home/ubuntu/jagasewa

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker-compose -f docker-compose.yml down
echo "✅ Old containers stopped"

# Start new containers
echo "🚀 Starting new containers..."
docker-compose -f docker-compose.yml up -d
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
    echo "⚠️ Backend health check failed (this might be okay if health endpoint doesn't exist)"
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