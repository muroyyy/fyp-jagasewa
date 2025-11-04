##########################################################
# JagaSewa Secrets Manager Module
##########################################################

# ─────────────────────────────────────────────────────────
# Generate Random Password for RDS
# ─────────────────────────────────────────────────────────
resource "random_password" "db_password" {
  length  = 16
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# ─────────────────────────────────────────────────────────
# Database Credentials Secret
# ─────────────────────────────────────────────────────────
resource "aws_secretsmanager_secret" "db_credentials" {
  name        = "${var.project_name}-db-credentials-${var.environment}"
  description = "Database credentials for JagaSewa application"

  tags = {
    Name    = "${var.project_name}-db-credentials"
    Project = var.project_name
    Env     = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    DB_HOST     = var.db_endpoint
    DB_NAME     = var.db_name
    DB_USERNAME = var.db_username
    DB_PASSWORD = random_password.db_password.result
  })
}

# ─────────────────────────────────────────────────────────
# Application Configuration Secret
# ─────────────────────────────────────────────────────────
resource "aws_secretsmanager_secret" "app_config" {
  name        = "${var.project_name}-app-config-${var.environment}"
  description = "Application configuration for JagaSewa"

  tags = {
    Name    = "${var.project_name}-app-config"
    Project = var.project_name
    Env     = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id
  secret_string = jsonencode({
    API_URL     = "https://api.${var.domain_name}"
    ENVIRONMENT = var.environment
    PROJECT_NAME = var.project_name
  })
}