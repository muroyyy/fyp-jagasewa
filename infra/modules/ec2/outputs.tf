##########################################################
# EC2 Module Outputs
##########################################################

output "iam_instance_profile_name" {
  description = "IAM instance profile name"
  value       = aws_iam_instance_profile.ec2_instance_profile.name
}

output "iam_role_arn" {
  description = "IAM role ARN"
  value       = aws_iam_role.ec2_role.arn
}

output "iam_role_name" {
  description = "IAM role attached to EC2 for SSM + S3 access"
  value       = aws_iam_role.ec2_role.name
}
