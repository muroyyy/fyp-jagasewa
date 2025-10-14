#!/bin/bash
# -------------------------------------------------
# JagaSewa EC2 Bootstrap Script (Docker + SSM + S3)
# -------------------------------------------------

# Update packages
apt update -y
apt upgrade -y

# Install Docker, Compose, and AWS CLI
apt install -y docker.io docker-compose awscli unzip curl

# Enable and start Docker
systemctl enable docker
systemctl start docker

# Install and enable AWS SSM Agent
snap install amazon-ssm-agent --classic
systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent.service
systemctl start snap.amazon-ssm-agent.amazon-ssm-agent.service

# Retrieve the latest build artifacts from S3
aws s3 cp s3://${S3_BUCKET_NAME}/backend /srv/jagasewa-backend --recursive
aws s3 cp s3://${S3_BUCKET_NAME}/frontend /srv/jagasewa-frontend --recursive

# Build and run Docker containers
cd /srv/jagasewa-backend
docker-compose up -d

echo "✅ EC2 instance setup complete and Docker containers running."
