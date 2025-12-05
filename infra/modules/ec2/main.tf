##########################################################
# JagaSewa EC2 Module (Backend Docker Host + SSM)
##########################################################

# ─────────────────────────────────────────────────────────
# IAM Role for EC2
# ─────────────────────────────────────────────────────────
resource "aws_iam_role" "ec2_role" {
  name = "${var.project_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name    = "${var.project_name}-ec2-role"
    Project = var.project_name
  }
}

# Attach SSM Managed Policy
resource "aws_iam_role_policy_attachment" "ssm_access" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# Attach S3 Read Only Policy
resource "aws_iam_role_policy_attachment" "s3_readonly" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
}

# Attach ECR Read Only Policy
resource "aws_iam_role_policy_attachment" "ecr_readonly" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Custom policy for Secrets Manager access
resource "aws_iam_role_policy" "secrets_access" {
  name = "${var.project_name}-secrets-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = [
          "arn:aws:secretsmanager:*:*:secret:${var.project_name}-*"
        ]
      }
    ]
  })
}

# Custom policy for S3 assets upload
resource "aws_iam_role_policy" "s3_assets_access" {
  name = "${var.project_name}-s3-assets-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:DeleteObject",
          "s3:GetObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-assets-${var.environment}/*"
        ]
      }
    ]
  })
}

# Custom policy for Rekognition access
resource "aws_iam_role_policy" "rekognition_access" {
  name = "${var.project_name}-rekognition-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rekognition:DetectLabels",
          "rekognition:DetectModerationLabels",
          "rekognition:DetectText"
        ]
        Resource = "*"
      }
    ]
  })
}

# Custom policy for DynamoDB access
resource "aws_iam_role_policy" "dynamodb_access" {
  name = "${var.project_name}-dynamodb-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          "arn:aws:dynamodb:*:*:table/${var.project_name}-messages-${var.environment}",
          "arn:aws:dynamodb:*:*:table/${var.project_name}-conversations-${var.environment}",
          "arn:aws:dynamodb:*:*:table/${var.project_name}-messages-${var.environment}/index/*",
          "arn:aws:dynamodb:*:*:table/${var.project_name}-conversations-${var.environment}/index/*"
        ]
      }
    ]
  })
}

# Create Instance Profile
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = "${var.project_name}-ec2-instance-profile"
  role = aws_iam_role.ec2_role.name
}

# ─────────────────────────────────────────────────────────
# Single EC2 Instance
# ─────────────────────────────────────────────────────────
resource "aws_instance" "backend" {
  ami           = var.ami_id
  instance_type = var.instance_type
  subnet_id     = var.public_subnet_ids[0]
  
  vpc_security_group_ids = [var.ec2_sg_id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_instance_profile.name
  
  user_data = base64encode(file("${path.module}/../../user_data/docker-bootstrap.sh"))
  
  root_block_device {
    volume_size           = 16
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }
  
  tags = {
    Name    = "${var.project_name}-backend"
    Project = var.project_name
    Env     = var.environment
  }
}

# Attach instance to ALB target group
resource "aws_lb_target_group_attachment" "backend" {
  target_group_arn = var.target_group_arn
  target_id        = aws_instance.backend.id
  port             = 80
}
