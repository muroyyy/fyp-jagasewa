##########################################################
# JagaSewa RDS (MySQL) Module
##########################################################

# ─────────────────────────────────────────────────────────
# DB Subnet Group (Private Subnets)
# ─────────────────────────────────────────────────────────
resource "aws_db_subnet_group" "this" {
  name       = "${var.project_name}-rds-subnet-group"
  subnet_ids = var.private_subnet_ids
  description = "Subnet group for JagaSewa RDS instance"

  tags = {
    Name    = "${var.project_name}-rds-subnet-group"
    Project = var.project_name
  }
}

# ─────────────────────────────────────────────────────────
# RDS Instance (MySQL)
# ─────────────────────────────────────────────────────────
resource "aws_db_instance" "this" {
  identifier              = "${var.project_name}-rds-${var.environment}"
  allocated_storage       = 20
  storage_type            = "gp3"
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = var.instance_class
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  multi_az                = false
  publicly_accessible     = false
  
  # Backup & Snapshot Configuration
  skip_final_snapshot       = var.environment == "dev" ? true : false
  final_snapshot_identifier = var.environment == "dev" ? null : "${var.project_name}-rds-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"
  backup_retention_period   = 7
  backup_window             = "03:00-04:00"  # UTC time
  maintenance_window        = "mon:04:00-mon:05:00"  # UTC time
  
  # Enable automated backups
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]
  
  deletion_protection     = var.environment == "prod" ? true : false

  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [var.rds_sg_id]

  tags = {
    Name    = "${var.project_name}-rds"
    Project = var.project_name
    Env     = var.environment
  }
  
  lifecycle {
    ignore_changes = [final_snapshot_identifier]
  }
}