##########################################################
# S3 Module Outputs
##########################################################

output "frontend_bucket_name" {
  description = "Frontend S3 bucket name"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_url" {
  description = "Frontend S3 website URL (if hosting enabled)"
  value       = var.enable_static_website ? aws_s3_bucket_website_configuration.frontend_website[0].website_endpoint : null
}

output "artifacts_bucket_name" {
  description = "Artifacts S3 bucket name (for EC2 builds)"
  value       = aws_s3_bucket.artifacts.bucket
}
