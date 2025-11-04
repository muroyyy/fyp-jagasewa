#!/bin/bash
# =========================================================
# Auto-update GitHub Secrets from Terraform Outputs
# =========================================================

set -e

# Configuration
REPO="muroyyy/fyp-jagasewa" 
TERRAFORM_DIR="${TERRAFORM_DIR:-../infra}"

echo "🔄 Updating GitHub secrets from Terraform outputs..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Install with: brew install gh"
    exit 1
fi

# Check if logged into GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged into GitHub CLI. Run: gh auth login"
    exit 1
fi

# Navigate to terraform directory
cd $TERRAFORM_DIR

# Get terraform outputs
echo "📋 Getting Terraform outputs..."

# Try to get environment from terraform outputs or determine from existing resources
ENVIRONMENT="prod"  # Default to prod

# Check if we can determine environment from AWS resources
if aws s3 ls | grep -q "jagasewa-frontend-prod"; then
    ENVIRONMENT="prod"
elif aws s3 ls | grep -q "jagasewa-frontend-dev"; then
    ENVIRONMENT="dev"
fi

echo "🌍 Detected environment: $ENVIRONMENT"

S3_FRONTEND="jagasewa-frontend-$ENVIRONMENT"
S3_ARTIFACTS="jagasewa-artifacts-$ENVIRONMENT"
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
INSTANCE_ID=$(terraform output -raw instance_id 2>/dev/null || echo "")
ECR_REPO_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "")
ECR_REPO_NAME="jagasewa-backend"

# Validate outputs
if [[ -z "$CLOUDFRONT_ID" || -z "$INSTANCE_ID" || -z "$ECR_REPO_URL" ]]; then
    echo "❌ Missing terraform outputs. Make sure terraform apply completed successfully."
    echo "Available outputs:"
    terraform output
    exit 1
fi

echo "📋 Found outputs:"
echo "  - ENVIRONMENT: $ENVIRONMENT"
echo "  - S3_FRONTEND: $S3_FRONTEND"
echo "  - S3_ARTIFACTS: $S3_ARTIFACTS"
echo "  - CLOUDFRONT_ID: $CLOUDFRONT_ID"
echo "  - INSTANCE_ID: $INSTANCE_ID"
echo "  - ECR_REPO_URL: $ECR_REPO_URL"
echo "  - ECR_REPO_NAME: $ECR_REPO_NAME"

# Update GitHub secrets
echo "🔐 Updating GitHub repository secrets..."

gh secret set S3_FRONTEND_BUCKET -b"$S3_FRONTEND" -R $REPO
gh secret set S3_ARTIFACTS_BUCKET -b"$S3_ARTIFACTS" -R $REPO  
gh secret set CLOUDFRONT_DISTRIBUTION_ID -b"$CLOUDFRONT_ID" -R $REPO
gh secret set INSTANCE_ID -b"$INSTANCE_ID" -R $REPO
gh secret set ECR_REPOSITORY_URL -b"$ECR_REPO_URL" -R $REPO
gh secret set ECR_REPOSITORY_NAME -b"$ECR_REPO_NAME" -R $REPO

echo "✅ GitHub secrets updated successfully!"
echo ""
echo "📋 Updated secrets:"
echo "  - S3_FRONTEND_BUCKET: $S3_FRONTEND"
echo "  - S3_ARTIFACTS_BUCKET: $S3_ARTIFACTS"
echo "  - CLOUDFRONT_DISTRIBUTION_ID: $CLOUDFRONT_ID"
echo "  - INSTANCE_ID: $INSTANCE_ID"
echo "  - ECR_REPOSITORY_URL: $ECR_REPO_URL"
echo "  - ECR_REPOSITORY_NAME: $ECR_REPO_NAME"
echo ""
echo "🚀 Your CI/CD workflows are now ready to use ECR!"