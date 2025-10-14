##########################################################
# S3 Module Variables
##########################################################

variable "project_name" {
  description = "Project name prefix for S3 bucket naming"
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev/prod)"
  type        = string
  default     = "dev"
}

variable "enable_versioning" {
  description = "Enable versioning on both S3 buckets"
  type        = bool
  default     = true
}

variable "enable_static_website" {
  description = "Enable static website hosting for frontend bucket"
  type        = bool
  default     = true
}

variable "enable_lifecycle" {
  description = "Enable lifecycle rule for artifact bucket"
  type        = bool
  default     = false
}

variable "lifecycle_expiration_days" {
  description = "Days before non-current versions are deleted"
  type        = number
  default     = 90
}
