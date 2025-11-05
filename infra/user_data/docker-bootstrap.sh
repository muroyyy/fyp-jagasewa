#!/bin/bash
# -------------------------------------------------
# JagaSewa EC2 Bootstrap Script (Backend Only + Secrets Manager)
# -------------------------------------------------

# Update packages
apt update -y
apt upgrade -y

# Install Docker, Compose, and dependencies
apt install -y docker.io docker-compose unzip curl

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Add ubuntu and ssm-user to docker group
usermod -aG docker ubuntu
usermod -aG docker ssm-user

# Install and enable AWS SSM Agent
snap install amazon-ssm-agent --classic
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service

# Create application directory
mkdir -p /srv/jagasewa-backend
chown ubuntu:ubuntu /srv/jagasewa-backend

# Set up environment variables for Secrets Manager
echo 'export AWS_DEFAULT_REGION=ap-southeast-1' >> /home/ubuntu/.bashrc
echo 'export DB_SECRET_NAME=jagasewa-db-credentials-prod' >> /home/ubuntu/.bashrc

# Create Docker cleanup script inline
cat > /usr/local/bin/docker_cleanup.sh << 'EOF'
#!/bin/bash
# Docker Image Cleanup Script - Keep only 10 most recent images
# Triggered automatically when image count exceeds 10

# Count jagasewa-backend images
IMAGE_COUNT=$(docker images | grep "jagasewa-backend" | wc -l)

if [ "$IMAGE_COUNT" -gt 10 ]; then
    echo "Found $IMAGE_COUNT images, cleaning up to keep only 10..."
    
    # Get old images to remove (keep newest 10)
    IMAGES_TO_REMOVE=$(docker images --format "{{.Repository}}:{{.Tag}} {{.CreatedAt}}" | \
                       grep "jagasewa-backend" | \
                       sort -k2 -r | \
                       tail -n +11 | \
                       awk '{print $1}')
    
    if [ ! -z "$IMAGES_TO_REMOVE" ]; then
        echo "$IMAGES_TO_REMOVE" | while read image; do
            echo "Removing: $image"
            docker rmi "$image" 2>/dev/null || true
        done
        
        # Clean up dangling images
        docker system prune -f >/dev/null 2>&1
        
        NEW_COUNT=$(docker images | grep "jagasewa-backend" | wc -l)
        echo "Cleanup completed. Images: $IMAGE_COUNT -> $NEW_COUNT"
    fi
else
    echo "Image count ($IMAGE_COUNT) is within limit (10). No cleanup needed."
fi
EOF
chmod +x /usr/local/bin/docker_cleanup.sh

# Create alias for automatic cleanup after docker pull
echo 'alias docker-pull="docker pull \$1 && /usr/local/bin/docker_cleanup.sh"' >> /etc/bash.bashrc
echo 'alias docker-pull="docker pull \$1 && /usr/local/bin/docker_cleanup.sh"' >> /home/ubuntu/.bashrc

# Run initial cleanup if there are already images
/usr/local/bin/docker_cleanup.sh

echo "✅ EC2 instance setup complete. Ready for backend deployment."
echo "📝 Backend will be deployed via CI/CD pipeline."
echo "🔐 Database credentials will be retrieved from AWS Secrets Manager."
echo "🧹 Docker cleanup will trigger automatically when image count exceeds 10."
