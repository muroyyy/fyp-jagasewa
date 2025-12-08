output "bucket_name" {
  value = aws_s3_bucket.ic_verification.bucket
}

output "bucket_arn" {
  value = aws_s3_bucket.ic_verification.arn
}
