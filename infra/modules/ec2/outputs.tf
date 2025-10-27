##########################################################
# EC2 Module Outputs
##########################################################

output "autoscaling_group_id" {
  description = "ID of the Auto Scaling Group"
  value       = aws_autoscaling_group.backend.id
}

output "autoscaling_group_arn" {
  description = "ARN of the Auto Scaling Group"
  value       = aws_autoscaling_group.backend.arn
}

output "launch_template_id" {
  description = "ID of the Launch Template"
  value       = aws_launch_template.backend.id
}

output "iam_role_name" {
  description = "IAM role attached to EC2 for SSM + S3 access"
  value       = aws_iam_role.ec2_role.name
}
