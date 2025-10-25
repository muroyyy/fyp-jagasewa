##########################################################
# S3 Module Outputs
##########################################################

output "frontend_bucket_name" {
  description = "Frontend S3 bucket name"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_domain_name" {
  description = "Frontend S3 bucket domain name for CloudFront origin"
  value       = aws_s3_bucket.frontend.bucket_domain_name
}

output "artifacts_bucket_name" {
  description = "Artifacts S3 bucket name (for EC2 builds)"
  value       = aws_s3_bucket.artifacts.bucket
}
