##########################################################
# ALB Module Outputs
##########################################################

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.this.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.this.arn
}

output "target_group_arn" {
  description = "Target Group ARN to attach EC2 instances"
  value       = aws_lb_target_group.backend_tg.arn
}
