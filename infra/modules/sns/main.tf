# SNS Topic for Payment Reminders
resource "aws_sns_topic" "payment_reminders" {
  name = "jagasewa-payment-reminders-${var.environment}"
  
  tags = {
    Name        = "JagaSewa Payment Reminders"
    Environment = var.environment
    Project     = "JagaSewa"
  }
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "payment_reminders_policy" {
  arn = aws_sns_topic.payment_reminders.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = var.ec2_role_arn
        }
        Action = [
          "SNS:Publish"
        ]
        Resource = aws_sns_topic.payment_reminders.arn
      }
    ]
  })
}

# Output the topic ARN
output "sns_topic_arn" {
  value = aws_sns_topic.payment_reminders.arn
  description = "ARN of the payment reminders SNS topic"
}