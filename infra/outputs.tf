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
