##########################################################
# JagaSewa S3 Buckets (Frontend Hosting + Artifacts Storage)
##########################################################

locals {
  frontend_bucket_name = "${var.project_name}-frontend-${var.environment}"
  artifacts_bucket_name = "${var.project_name}-artifacts-${var.environment}"
}

# ─────────────────────────────────────────────────────────
# Frontend Bucket (Public Hosting)
# ─────────────────────────────────────────────────────────
resource "aws_s3_bucket" "frontend" {
  bucket = local.frontend_bucket_name

  tags = {
    Name    = local.frontend_bucket_name
    Project = var.project_name
    Env     = var.environment
  }
}

# Versioning for Frontend Bucket
resource "aws_s3_bucket_versioning" "frontend_versioning" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# Server-Side Encryption (AES-256)
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend_sse" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Static Website Hosting (for React build)
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  count  = var.enable_static_website ? 1 : 0
  bucket = aws_s3_bucket.frontend.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Public Access Block (disable restrictions for hosting)
resource "aws_s3_bucket_public_access_block" "frontend_public_access" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Public Read Policy for Frontend Bucket
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "PublicReadGetObject",
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
      }
    ]
  })
}

# ─────────────────────────────────────────────────────────
# Artifacts Bucket (Private)
# ─────────────────────────────────────────────────────────
resource "aws_s3_bucket" "artifacts" {
  bucket = local.artifacts_bucket_name

  tags = {
    Name    = local.artifacts_bucket_name
    Project = var.project_name
    Env     = var.environment
  }
}

# Versioning for Artifacts Bucket
resource "aws_s3_bucket_versioning" "artifacts_versioning" {
  bucket = aws_s3_bucket.artifacts.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# Server-Side Encryption for Artifacts Bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts_sse" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Public Access Block (fully locked down)
resource "aws_s3_bucket_public_access_block" "artifacts_public_access" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─────────────────────────────────────────────────────────
# (Optional) Lifecycle Rule for Old Version Cleanup
# ─────────────────────────────────────────────────────────
resource "aws_s3_bucket_lifecycle_configuration" "artifacts_lifecycle" {
  count  = var.enable_lifecycle ? 1 : 0
  bucket = aws_s3_bucket.artifacts.id

  rule {
    id     = "expire-old-versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = var.lifecycle_expiration_days
    }
  }
}
