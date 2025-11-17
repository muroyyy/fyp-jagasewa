#!/bin/bash

echo "🚀 Deploying Hybrid Messaging Infrastructure..."

# Navigate to infrastructure directory
cd /home/amirulfaiz/fyp-jagasewa/infra

# Initialize Terraform (if needed)
echo "📋 Initializing Terraform..."
terraform init

# Plan the deployment
echo "📊 Planning Terraform deployment..."
terraform plan -var-file="env/prod.tfvars"

# Apply the changes
echo "🔧 Applying Terraform changes..."
terraform apply -var-file="env/prod.tfvars" -auto-approve

# Get DynamoDB table names
echo "📝 Getting DynamoDB table information..."
MESSAGES_TABLE=$(terraform output -raw dynamodb_messages_table)
CONVERSATIONS_TABLE=$(terraform output -raw dynamodb_conversations_table)

echo "✅ DynamoDB Tables Created:"
echo "   Messages Table: $MESSAGES_TABLE"
echo "   Conversations Table: $CONVERSATIONS_TABLE"

# Update environment variables in secrets
echo "🔐 Updating application secrets..."
aws secretsmanager update-secret --secret-id "jagasewa-app-config-prod" \
  --secret-string "{
    \"API_URL\": \"https://api.jagasewa.com\",
    \"ENVIRONMENT\": \"prod\",
    \"PROJECT_NAME\": \"jagasewa\",
    \"DYNAMODB_MESSAGES_TABLE\": \"$MESSAGES_TABLE\",
    \"DYNAMODB_CONVERSATIONS_TABLE\": \"$CONVERSATIONS_TABLE\"
  }" \
  --region ap-southeast-1

echo "🎉 Hybrid messaging infrastructure deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your application to use the new hybrid messaging API"
echo "2. Test the messaging functionality"
echo "3. Monitor DynamoDB usage and costs"