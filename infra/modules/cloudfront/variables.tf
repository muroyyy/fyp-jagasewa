variable "project_name" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment (dev/prod)"
  type        = string
}

variable "domain_name" {
  description = "Domain name for CloudFront alias"
  type        = string
}

variable "s3_bucket_name" {
  description = "S3 bucket name for origin"
  type        = string
}

variable "s3_bucket_domain_name" {
  description = "S3 bucket domain name"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN (us-east-1)"
  type        = string
}

variable "alb_dns_name" {
  description = "ALB DNS name for backend API origin"
  type        = string
}