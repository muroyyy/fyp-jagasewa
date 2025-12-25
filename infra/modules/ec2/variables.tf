##########################################################
# EC2 Module Variables (IAM Resources Only)
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