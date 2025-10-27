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

output "autoscaling_group_id" {
  description = "Auto Scaling Group ID for backend instances"
  value       = module.ec2.autoscaling_group_id
}

output "ecr_repository_url" {
  description = "ECR repository URL for backend Docker images"
  value       = module.ecr.repository_url
}
