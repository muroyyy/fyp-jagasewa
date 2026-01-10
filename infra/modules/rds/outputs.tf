##########################################################
# RDS Module Outputs
##########################################################

output "db_endpoint" {
  description = "RDS primary endpoint address"
  value       = aws_db_instance.this.address
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.this.db_name
}

output "db_primary_arn" {
  description = "RDS primary instance ARN"
  value       = aws_db_instance.this.arn
}

output "multi_az_enabled" {
  description = "Whether Multi-AZ is enabled"
  value       = aws_db_instance.this.multi_az
}
