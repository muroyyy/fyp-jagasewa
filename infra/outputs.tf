##########################################################
# Root Outputs
##########################################################

output "rds_connection_string" {
  description = "Database connection string for backend"
  value       = module.rds.db_endpoint
}

output "backend_public_ip" {
  description = "Public IP address of the backend EC2 instance"
  value       = module.ec2.instance_public_ip
}

output "frontend_bucket_url" {
  description = "Public S3 bucket URL hosting React build files"
  value       = "https://${module.s3.bucket_name}.s3.amazonaws.com"
}
