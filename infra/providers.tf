##########################################################
# Provider Configuration
##########################################################

# Default AWS Provider (Regional)
provider "aws" {
  region = var.aws_region
}

# AWS Provider for CloudFront certificates (us-east-1 required)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Data source for AWS caller identity
data "aws_caller_identity" "current" {}

output "aws_account_id" {
  value = data.aws_caller_identity.current.account_id
}
