output "bucket_name" {
  description = "Name of the S3 assets bucket"
  value       = aws_s3_bucket.assets.bucket
}

output "bucket_arn" {
  description = "ARN of the S3 assets bucket"
  value       = aws_s3_bucket.assets.arn
}

output "bucket_domain_name" {
  description = "Domain name of the S3 assets bucket"
  value       = aws_s3_bucket.assets.bucket_domain_name
}