##########################################################
# JagaSewa Route53 Module (DNS Management)
##########################################################

# ─────────────────────────────────────────────────────────
# Hosted Zone for Domain
# ─────────────────────────────────────────────────────────
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name    = "${var.project_name}-hosted-zone"
    Project = var.project_name
    Env     = var.environment
  }
}

# ─────────────────────────────────────────────────────────
# A Record for Frontend (CloudFront)
# ─────────────────────────────────────────────────────────
resource "aws_route53_record" "frontend" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.cloudfront_domain_name
    zone_id                = var.cloudfront_hosted_zone_id
    evaluate_target_health = false
  }
}

# ─────────────────────────────────────────────────────────
# A Record for Backend API (ALB)
# ─────────────────────────────────────────────────────────
resource "aws_route53_record" "backend" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}