##########################################################
# Root Outputs
##########################################################

output "frontend_url" {
  description = "Frontend URL (CloudFront)"
  value       = "https://${var.domain_name}"
}

output "backend_api_url" {
  description = "Backend API URL (ALB)"
  value       = "https://api.${var.domain_name}"
}

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = module.cloudfront.distribution_id
}

output "route53_nameservers" {
  description = "Route53 nameservers for domain configuration"
  value       = module.route53.name_servers
}

output "db_credentials_secret_name" {
  description = "Secrets Manager secret name for database credentials"
  value       = module.secrets.db_credentials_secret_name
}

output "app_config_secret_name" {
  description = "Secrets Manager secret name for app configuration"
  value       = module.secrets.app_config_secret_name
}

output "instance_id" {
  description = "Backend EC2 instance ID"
  value       = module.ec2.instance_id
}

output "ecr_repository_url" {
  description = "ECR repository URL for backend Docker images"
  value       = module.ecr.repository_url
}

output "dynamodb_messages_table" {
  description = "DynamoDB messages table name"
  value       = module.dynamodb.messages_table_name
}

output "dynamodb_conversations_table" {
  description = "DynamoDB conversations table name"
  value       = module.dynamodb.conversations_table_name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for payment reminders"
  value       = module.sns.sns_topic_arn
}

output "ec2_instance_profile" {
  description = "EC2 instance profile name for SNS permissions"
  value       = module.iam.ec2_instance_profile_name
}
