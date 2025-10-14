##########################################################
# JagaSewa Application Load Balancer Module
##########################################################

# ─────────────────────────────────────────────────────────
# ALB Creation (Internet-facing)
# ─────────────────────────────────────────────────────────
resource "aws_lb" "this" {
  name               = "${var.project_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false

  tags = {
    Name    = "${var.project_name}-alb"
    Project = var.project_name
    Env     = var.environment
  }
}

# ─────────────────────────────────────────────────────────
# Target Group (EC2 Backend)
# ─────────────────────────────────────────────────────────
resource "aws_lb_target_group" "backend_tg" {
  name        = "${var.project_name}-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    path                = "/"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 2
    matcher             = "200-399"
  }

  tags = {
    Name    = "${var.project_name}-tg"
    Project = var.project_name
  }
}

# ─────────────────────────────────────────────────────────
# HTTP Listener (Port 80 → Redirect to HTTPS)
# ─────────────────────────────────────────────────────────
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.this.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = {
    Name = "${var.project_name}-http-redirect"
  }
}

# ─────────────────────────────────────────────────────────
# HTTPS Listener (Port 443 → Forward to Target Group)
# ─────────────────────────────────────────────────────────
resource "aws_lb_listener" "https_listener" {
  load_balancer_arn = aws_lb.this.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend_tg.arn
  }

  tags = {
    Name = "${var.project_name}-https-listener"
  }
}
