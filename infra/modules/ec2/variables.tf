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
  description = "Ubuntu 22.04 LTS AMI ID (x86_64)"
  type        = string
  default     = "ami-0c1907b6d738188e5" # Singapore (ap-southeast-1)
}

variable "instance_type" {
  description = "Instance type for backend EC2"
  type        = string
  default     = "t3.small"
}

variable "subnet_id" {
  description = "Public subnet ID to deploy EC2 instance"
  type        = string
}

variable "ec2_sg_id" {
  description = "Security Group ID for EC2 backend"
  type        = string
}
