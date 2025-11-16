# S3 Bucket Policy to allow public read access to documents, payments, and maintenance
resource "aws_s3_bucket_policy" "artifacts_public_policy" {
  bucket = aws_s3_bucket.artifacts.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadDocuments"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.artifacts.arn}/documents/*"
      },
      {
        Sid       = "PublicReadPayments"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.artifacts.arn}/payments/*"
      },
      {
        Sid       = "PublicReadMaintenance"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.artifacts.arn}/maintenance/*"
      }
    ]
  })
}

# Update public access block to allow bucket policy for documents and payments
resource "aws_s3_bucket_public_access_block" "artifacts_public_pab" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = false  # Allow bucket policy
  ignore_public_acls      = true
  restrict_public_buckets = false  # Allow public read via policy
}