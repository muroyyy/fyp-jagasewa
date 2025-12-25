variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment (dev/prod)"
  type        = string
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "ec2_sg_id" {
  description = "Security group ID for EC2 instances"
  type        = string
}

variable "target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}

variable "iam_instance_profile_name" {
  description = "IAM instance profile name"
  type        = string
}