resource "aws_dynamodb_table" "messages" {
  name           = "${var.project_name}-messages-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "conversation_id"
  range_key      = "timestamp"

  attribute {
    name = "conversation_id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  attribute {
    name = "receiver_id"
    type = "S"
  }

  global_secondary_index {
    name               = "ReceiverIndex"
    hash_key           = "receiver_id"
    range_key          = "timestamp"
    projection_type    = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "${var.project_name}-messages-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_dynamodb_table" "conversations" {
  name         = "${var.project_name}-conversations-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "conversation_id"

  attribute {
    name = "conversation_id"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name               = "UserIndex"
    hash_key           = "user_id"
    projection_type    = "ALL"
  }

  tags = {
    Name        = "${var.project_name}-conversations-${var.environment}"
    Environment = var.environment
    Project     = var.project_name
  }
}