output "ec2_role_arn" {
  value = aws_iam_role.ec2_sns_role.arn
  description = "ARN of the EC2 role for SNS publishing"
}

output "ec2_instance_profile_name" {
  value = aws_iam_instance_profile.ec2_profile.name
  description = "Name of the EC2 instance profile"
}