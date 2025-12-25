output "asg_name" {
  description = "Auto Scaling Group name"
  value       = aws_autoscaling_group.backend.name
}

output "asg_arn" {
  description = "Auto Scaling Group ARN"
  value       = aws_autoscaling_group.backend.arn
}

output "launch_template_id" {
  description = "Launch template ID"
  value       = aws_launch_template.backend.id
}