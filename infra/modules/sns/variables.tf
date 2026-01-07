variable "environment" {
  description = "Environment name (dev/prod)"
  type        = string
}

variable "ec2_role_arn" {
  description = "ARN of the EC2 role that needs SNS publish permissions"
  type        = string
}