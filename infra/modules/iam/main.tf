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
