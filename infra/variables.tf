##########################################################
# Global Variables
##########################################################

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "availability_zones" {
  description = "Availability zones to deploy resources"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "ec2_instance_type" {
  description = "EC2 instance type for backend container"
  type        = string
  default     = "t3.micro"
}

variable "ec2_key_name" {
  description = "Key pair name for EC2 access"
  type        = string
  default     = "terraform-key-pair"
}

variable "db_name" {
  description = "Database name for JagaSewa"
  type        = string
  default     = "jagasewa_db"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
}

variable "s3_bucket_name" {
  description = "S3 bucket name for frontend assets"
  type        = string
  default     = "jagasewa-frontend-assets"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "jagasewa"
}

variable "environment" {
  description = "Deployment environment (dev/prod)"
  type        = string
  default     = "dev"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "jagasewa_db"
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}