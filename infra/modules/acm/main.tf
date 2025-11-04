##########################################################
# JagaSewa ACM Module (SSL Certificates)
##########################################################

# ─────────────────────────────────────────────────────────
# SSL Certificate for CloudFront (us-east-1)
# ─────────────────────────────────────────────────────────
resource "aws_acm_certificate" "cloudfront" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name    = "${var.project_name}-cloudfront-cert"
    Project = var.project_name
  }
}

# ─────────────────────────────────────────────────────────
# SSL Certificate for ALB (Regional)
# ─────────────────────────────────────────────────────────
resource "aws_acm_certificate" "alb" {
  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name    = "${var.project_name}-alb-cert"
    Project = var.project_name
  }
}

# ─────────────────────────────────────────────────────────
# DNS Validation Records for CloudFront Certificate
# ─────────────────────────────────────────────────────────
resource "aws_route53_record" "cloudfront_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cloudfront.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.hosted_zone_id
}

# ─────────────────────────────────────────────────────────
# DNS Validation Records for ALB Certificate
# ─────────────────────────────────────────────────────────
resource "aws_route53_record" "alb_validation" {
  for_each = {
    for dvo in aws_acm_certificate.alb.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.hosted_zone_id
}

# ─────────────────────────────────────────────────────────
# Certificate Validation
# ─────────────────────────────────────────────────────────
resource "aws_acm_certificate_validation" "cloudfront" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.cloudfront.arn
  validation_record_fqdns = [for record in aws_route53_record.cloudfront_validation : record.fqdn]
}

resource "aws_acm_certificate_validation" "alb" {
  certificate_arn = aws_acm_certificate.alb.arn
  validation_record_fqdns = [for record in aws_route53_record.alb_validation : record.fqdn]
}