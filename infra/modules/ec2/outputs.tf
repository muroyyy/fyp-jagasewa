##########################################################
# EC2 Module Outputs
##########################################################

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.backend.id
}

output "instance_public_ip" {
  description = "EC2 instance public IP"
  value       = aws_instance.backend.public_ip
}

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
