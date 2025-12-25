##########################################################
# EC2 Module Variables
##########################################################

variable "project_name" {
  description = "Project name for tagging"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev/prod)"
  type        = string
  default     = "dev"
}

variable "ami_id" {
  description = "AMI ID for EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "ec2_sg_id" {
  description = "Security group ID for EC2"
  type        = string
}

variable "target_group_arn" {
  description = "ALB target group ARN"
  type        = string
}