##########################################################
# Root Module - JagaSewa Infrastructure (AWS Cloud)
##########################################################

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {
    bucket = "jagasewa-terraform-state"
    key    = "infra/terraform.tfstate"
    region = "ap-southeast-1"
  }
}

provider "aws" {
  region = var.aws_region
}

##########################################################
# 🧩 MODULES - Connect all modular components
##########################################################

module "vpc" {
  source               = "./modules/vpc"
  vpc_cidr             = var.vpc_cidr
  public_subnets       = var.public_subnets
  private_subnets      = var.private_subnets
  availability_zones   = var.availability_zones
  enable_nat_gateway   = true
}

module "iam" {
  source = "./modules/iam"
}

module "security" {
  source            = "./modules/security"
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
}

module "rds" {
  source              = "./modules/rds"
  db_identifier       = "jagasewa-db"
  db_name             = var.db_name
  db_username         = var.db_username
  db_password         = var.db_password
  subnet_ids          = module.vpc.private_subnet_ids
  vpc_security_groups = [module.security.rds_sg_id]
}

module "ec2" {
  source              = "./modules/ec2"
  instance_type       = var.ec2_instance_type
  key_name            = var.ec2_key_name
  subnet_id           = module.vpc.public_subnet_ids[0]
  vpc_security_groups = [module.security.ec2_sg_id]
  iam_instance_profile = module.iam.ec2_instance_profile
  user_data           = file("${path.module}/user_data/docker-bootstrap.sh")
}

module "s3" {
  source          = "./modules/s3"
  bucket_name     = var.s3_bucket_name
  versioning      = true
  force_destroy   = false
  acl             = "public-read"
}

##########################################################
# ⚙️ OUTPUT CONNECTIONS
##########################################################

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "rds_endpoint" {
  value = module.rds.db_endpoint
}

output "ec2_public_ip" {
  value = module.ec2.instance_public_ip
}

output "frontend_bucket" {
  value = module.s3.bucket_name
}

output "app_url" {
  description = "Public URL for JagaSewa backend"
  value       = "http://${module.ec2.instance_public_ip}"
}

##########################################################
# Application Load Balancer Module
##########################################################
module "alb" {
  source              = "./modules/alb"
  project_name        = var.project_name
  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  alb_sg_id           = module.security.alb_sg_id
  public_subnet_ids   = module.vpc.public_subnet_ids
  acm_certificate_arn = var.acm_certificate_arn
}

##########################################################
# EC2 Backend Module
##########################################################
module "ec2" {
  source             = "./modules/ec2"
  project_name       = var.project_name
  environment        = var.environment
  subnet_id          = module.vpc.public_subnet_ids[0]
  ec2_sg_id          = module.security.ec2_sg_id
  target_group_arn   = module.alb.target_group_arn
}

##########################################################
# Attach EC2 Instance to ALB Target Group
##########################################################
resource "aws_lb_target_group_attachment" "backend_attach" {
  target_group_arn = module.alb.target_group_arn
  target_id        = module.ec2.instance_id
  port             = 80
}

