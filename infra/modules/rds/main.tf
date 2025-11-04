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
  identifier              = "${var.project_name}-rds-prod"
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
  skip_final_snapshot     = true
  backup_retention_period = 7
  deletion_protection     = false

  db_subnet_group_name    = aws_db_subnet_group.this.name
  vpc_security_group_ids  = [var.rds_sg_id]

  tags = {
    Name    = "${var.project_name}-rds"
    Project = var.project_name
    Env     = var.environment
  }
}