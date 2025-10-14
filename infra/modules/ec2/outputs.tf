##########################################################
# EC2 Module Outputs
##########################################################

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.backend.id
}

output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.backend.public_ip
}

output "private_ip" {
  description = "Private IP address of the EC2 instance"
  value       = aws_instance.backend.private_ip
}

output "iam_role_name" {
  description = "IAM role attached to EC2 for SSM + S3 access"
  value       = aws_iam_role.ec2_role.name
}
