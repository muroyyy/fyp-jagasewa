variable "project_name" {
  description = "Project name prefix for tagging"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev/prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/24"
}

variable "availability_zones" {
  description = "List of availability zones for HA deployment"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "public_subnet_a_cidr" {
  description = "CIDR for public subnet in AZ A"
  type        = string
  default     = "10.0.0.0/26"
}

variable "public_subnet_b_cidr" {
  description = "CIDR for public subnet in AZ B"
  type        = string
  default     = "10.0.0.64/26"
}

variable "private_subnet_a_cidr" {
  description = "CIDR for private subnet in AZ A"
  type        = string
  default     = "10.0.0.128/26"
}

variable "private_subnet_b_cidr" {
  description = "CIDR for private subnet in AZ B"
  type        = string
  default     = "10.0.0.192/26"
}

variable "aws_region" {
  description = "AWS region for VPC endpoints"
  type        = string
  default     = "us-east-1"
}
