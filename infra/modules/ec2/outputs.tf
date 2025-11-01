##########################################################
# EC2 Module Outputs
##########################################################

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.backend.id
}

output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.backend.public_ip
}

output "instance_private_ip" {
  description = "Private IP of the EC2 instance"
  value       = aws_instance.backend.private_ip
}

output "iam_role_name" {
  description = "IAM role attached to EC2 for SSM + S3 access"
  value       = aws_iam_role.ec2_role.name
}
