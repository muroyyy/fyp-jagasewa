##########################################################
# RDS Module Variables
##########################################################

variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev/prod)"
  type        = string
  default     = "dev"
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for RDS"
  type        = list(string)
}

variable "rds_sg_id" {
  description = "Security Group ID for RDS database"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "jagasewa_db"
}

variable "db_username" {
  description = "Master DB username"
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "Master DB password"
  type        = string
  sensitive   = true
}

variable "instance_class" {
  description = "Instance type for RDS"
  type        = string
  default     = "db.t3.micro"
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment for high availability (allows stopping the instance)"
  type        = bool
  default     = false
}