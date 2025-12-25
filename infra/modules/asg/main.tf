##########################################################
# JagaSewa Auto Scaling Group Module
##########################################################

# ─────────────────────────────────────────────────────────
# Launch Template
# ─────────────────────────────────────────────────────────
resource "aws_launch_template" "backend" {
  name_prefix   = "${var.project_name}-backend-"
  image_id      = var.ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [var.ec2_sg_id]
  
  iam_instance_profile {
    name = var.iam_instance_profile_name
  }

  user_data = base64encode(file("${path.module}/../../user_data/docker-bootstrap.sh"))

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 16
      volume_type           = "gp3"
      delete_on_termination = true
      encrypted             = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name    = "${var.project_name}-backend-asg"
      Project = var.project_name
      Env     = var.environment
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ─────────────────────────────────────────────────────────
# Auto Scaling Group
# ─────────────────────────────────────────────────────────
resource "aws_autoscaling_group" "backend" {
  name                = "${var.project_name}-backend-asg"
  vpc_zone_identifier = var.public_subnet_ids
  target_group_arns   = [var.target_group_arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 2
  max_size         = 4
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.backend.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-backend-asg"
    propagate_at_launch = false
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "Env"
    value               = var.environment
    propagate_at_launch = true
  }
}

# ─────────────────────────────────────────────────────────
# Auto Scaling Policies
# ─────────────────────────────────────────────────────────
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.project_name}-scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.backend.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.project_name}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.backend.name
}

# ─────────────────────────────────────────────────────────
# CloudWatch Alarms
# ─────────────────────────────────────────────────────────
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "${var.project_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.backend.name
  }
}

resource "aws_cloudwatch_metric_alarm" "cpu_low" {
  alarm_name          = "${var.project_name}-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.backend.name
  }
}