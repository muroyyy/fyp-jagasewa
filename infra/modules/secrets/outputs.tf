output "db_password" {
  description = "Generated database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "db_credentials_secret_arn" {
  description = "ARN of database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "app_config_secret_arn" {
  description = "ARN of application config secret"
  value       = aws_secretsmanager_secret.app_config.arn
}

output "db_credentials_secret_name" {
  description = "Name of database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.name
}

output "app_config_secret_name" {
  description = "Name of application config secret"
  value       = aws_secretsmanager_secret.app_config.name
}