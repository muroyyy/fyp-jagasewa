# Production Environment Configuration
aws_region     = "ap-southeast-1"
project_name   = "jagasewa"
environment    = "prod"
domain_name    = "jagasewa.cloud"

# Network Configuration
vpc_cidr           = "10.0.0.0/16"
public_subnets     = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets    = ["10.0.3.0/24", "10.0.4.0/24"]
availability_zones = ["ap-southeast-1a", "ap-southeast-1b"]

# EC2 Configuration
ec2_instance_type = "t3.small"
ec2_key_name      = "terraform-key-pair"

# Database Configuration
db_name     = "jagasewa_prod_db"
db_username = "admin"
# db_password should be set via environment variable or prompt