# S3 bucket for IC verification (temporary storage)
resource "aws_s3_bucket" "ic_verification" {
  bucket = var.bucket_name
  tags   = var.tags
}

# Block all public access (privacy protection)
resource "aws_s3_bucket_public_access_block" "ic_verification" {
  bucket = aws_s3_bucket.ic_verification.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy to auto-delete files after 1 day (privacy protection)
resource "aws_s3_bucket_lifecycle_configuration" "ic_verification" {
  bucket = aws_s3_bucket.ic_verification.id

  rule {
    id     = "auto-delete-ic-images"
    status = "Enabled"

    expiration {
      days = 1
    }
  }
}
