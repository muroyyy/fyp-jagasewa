output "messages_table_name" {
  description = "Name of the DynamoDB messages table"
  value       = aws_dynamodb_table.messages.name
}

output "conversations_table_name" {
  description = "Name of the DynamoDB conversations table"
  value       = aws_dynamodb_table.conversations.name
}

output "messages_table_arn" {
  description = "ARN of the DynamoDB messages table"
  value       = aws_dynamodb_table.messages.arn
}

output "conversations_table_arn" {
  description = "ARN of the DynamoDB conversations table"
  value       = aws_dynamodb_table.conversations.arn
}