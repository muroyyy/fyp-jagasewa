variable "project_name" {
  description = "Project name prefix for tagging"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where security groups will be created"
  type        = string
}
