##########################################################
# ALB Module Outputs
##########################################################

output "dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.this.dns_name
}

output "zone_id" {
  description = "Hosted zone ID of the Application Load Balancer"
  value       = aws_lb.this.zone_id
}

output "arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.this.arn
}

output "target_group_arn" {
  description = "Target Group ARN to attach EC2 instances"
  value       = aws_lb_target_group.backend_tg.arn
}
