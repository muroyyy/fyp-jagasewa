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



##########################################################
# MODULES - Connect all modular components
##########################################################

module "vpc" {
  source                   = "./modules/vpc"
  project_name             = var.project_name
  environment              = var.environment
  vpc_cidr                 = var.vpc_cidr
  public_subnet_a_cidr     = var.public_subnets[0]
  public_subnet_b_cidr     = var.public_subnets[1]
  private_subnet_a_cidr    = var.private_subnets[0]
  private_subnet_b_cidr    = var.private_subnets[1]
  availability_zones       = var.availability_zones
}

module "security" {
  source       = "./modules/security"
  project_name = var.project_name
  vpc_id       = module.vpc.vpc_id
}

module "route53" {
  source                     = "./modules/route53"
  project_name               = var.project_name
  environment                = var.environment
  domain_name                = var.domain_name
  cloudfront_domain_name     = module.cloudfront.domain_name
  cloudfront_hosted_zone_id  = module.cloudfront.hosted_zone_id
  alb_dns_name               = module.alb.dns_name
  alb_zone_id                = module.alb.zone_id
}

module "acm" {
  source         = "./modules/acm"
  project_name   = var.project_name
  domain_name    = var.domain_name
  hosted_zone_id = module.route53.hosted_zone_id
  
  providers = {
    aws.us_east_1 = aws.us_east_1
  }
}

module "s3" {
  source                    = "./modules/s3"
  project_name              = var.project_name
  environment               = var.environment
  enable_versioning         = true
  enable_lifecycle          = false
  lifecycle_expiration_days = 90
  cloudfront_oac_id         = module.cloudfront.origin_access_control_id
}

module "cloudfront" {
  source                = "./modules/cloudfront"
  project_name          = var.project_name
  environment           = var.environment
  domain_name           = var.domain_name
  s3_bucket_name        = module.s3.frontend_bucket_name
  s3_bucket_domain_name = module.s3.frontend_bucket_domain_name
  certificate_arn       = module.acm.cloudfront_certificate_arn
}

module "alb" {
  source            = "./modules/alb"
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  alb_sg_id         = module.security.alb_sg_id
  public_subnet_ids = module.vpc.public_subnet_ids
  certificate_arn   = module.acm.alb_certificate_arn
}

module "ec2" {
  source            = "./modules/ec2"
  project_name      = var.project_name
  environment       = var.environment
  public_subnet_ids = module.vpc.public_subnet_ids
  ec2_sg_id         = module.security.ec2_sg_id
  target_group_arn  = module.alb.target_group_arn
  min_size          = 1
  max_size          = 3
  desired_capacity  = 2
}

module "secrets" {
  source       = "./modules/secrets"
  project_name = var.project_name
  environment  = var.environment
  domain_name  = var.domain_name
  db_endpoint  = module.rds.db_endpoint
  db_name      = var.db_name
  db_username  = var.db_username
}

module "rds" {
  source             = "./modules/rds"
  project_name       = var.project_name
  environment        = var.environment
  private_subnet_ids = module.vpc.private_subnet_ids
  rds_sg_id          = module.security.rds_sg_id
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = module.secrets.db_password
}

