#!/bin/bash
# -------------------------------------------------
# JagaSewa EC2 Bootstrap Script (Backend Only + Secrets Manager)
# -------------------------------------------------

# Update packages
apt update -y
apt upgrade -y

# Install Docker, Compose, and AWS CLI
apt install -y docker.io docker-compose awscli unzip curl

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Add ubuntu user to docker group
usermod -aG docker ubuntu

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

echo "✅ EC2 instance setup complete. Ready for backend deployment."
echo "📝 Backend will be deployed via CI/CD pipeline."
echo "🔐 Database credentials will be retrieved from AWS Secrets Manager."
