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

output "db_replica_endpoint" {
  description = "RDS read replica endpoint address"
  value       = var.create_read_replica ? aws_db_instance.replica[0].address : null
}

output "db_primary_arn" {
  description = "RDS primary instance ARN"
  value       = aws_db_instance.this.arn
}

output "db_replica_arn" {
  description = "RDS read replica ARN"
  value       = var.create_read_replica ? aws_db_instance.replica[0].arn : null
}