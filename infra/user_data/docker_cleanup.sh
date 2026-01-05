#!/bin/bash

# Docker cleanup script - keeps only the latest image
# Usage: ./docker_cleanup.sh

echo "🧹 Starting Docker cleanup..."

# Stop and remove all containers
echo "Stopping all containers..."
docker stop $(docker ps -aq) 2>/dev/null || true

echo "Removing all containers..."
docker rm $(docker ps -aq) 2>/dev/null || true

# Remove all images except the latest one
echo "Removing old images..."
docker image prune -af

# Remove unused volumes
echo "Removing unused volumes..."
docker volume prune -f

# Remove unused networks
echo "Removing unused networks..."
docker network prune -f

# Show remaining images
echo "✅ Cleanup complete. Remaining images:"
docker images

echo "💾 Disk usage after cleanup:"
df -h /