# GitHub Actions Deployer User
resource "aws_iam_user" "github_deployer" {
  name = "amirul-github-deployer"
  path = "/"
}

# ECR Policy for Docker image push
resource "aws_iam_policy" "github_ecr_policy" {
  name        = "GitHubActions-ECR-Policy"
  description = "Allows GitHub Actions to push Docker images to ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      }
    ]
  })
}

# Auto Scaling Policy for instance refresh
resource "aws_iam_policy" "github_asg_policy" {
  name        = "GitHubActions-ASG-Policy"
  description = "Allows GitHub Actions to trigger ASG instance refresh"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:StartInstanceRefresh",
          "autoscaling:DescribeInstanceRefreshes",
          "autoscaling:DescribeAutoScalingGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policies to user
resource "aws_iam_user_policy_attachment" "github_ecr" {
  user       = aws_iam_user.github_deployer.name
  policy_arn = aws_iam_policy.github_ecr_policy.arn
}

resource "aws_iam_user_policy_attachment" "github_asg" {
  user       = aws_iam_user.github_deployer.name
  policy_arn = aws_iam_policy.github_asg_policy.arn
}

# EC2 Role for SNS publishing
resource "aws_iam_role" "ec2_sns_role" {
  name = "ec2-sns-publisher-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

# SNS Publish Policy
resource "aws_iam_policy" "sns_publish_policy" {
  name        = "SNS-Publish-Policy"
  description = "Allows EC2 to publish to SNS topics"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = "arn:aws:sns:*:*:jagasewa-payment-reminders-*"
      }
    ]
  })
}

# Attach SNS policy to EC2 role
resource "aws_iam_role_policy_attachment" "ec2_sns_policy" {
  role       = aws_iam_role.ec2_sns_role.name
  policy_arn = aws_iam_policy.sns_publish_policy.arn
}

# Instance profile for EC2
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-sns-publisher-profile"
  role = aws_iam_role.ec2_sns_role.name
}
