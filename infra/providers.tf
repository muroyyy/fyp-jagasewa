##########################################################
# Provider Configuration
##########################################################

provider "aws" {
  region = var.aws_region
}

# Optional: Data source for AWS caller identity
data "aws_caller_identity" "current" {}

output "aws_account_id" {
  value = data.aws_caller_identity.current.account_id
}
