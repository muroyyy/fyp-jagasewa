##########################################################
# JagaSewa EC2 IAM Resources (for ASG)
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
          "arn:aws:s3:::${var.project_name}-assets-${var.environment}/*",
          "arn:aws:s3:::${var.project_name}-ic-verification/*"
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

# Custom policy for Textract access
resource "aws_iam_role_policy" "textract_access" {
  name = "${var.project_name}-textract-access"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "textract:DetectDocumentText",
          "textract:AnalyzeDocument"
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
