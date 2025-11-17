<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Aws\DynamoDb\DynamoDbClient;
use Aws\Exception\AwsException;

class DynamoDBHelper {
    private $client;
    private $messagesTable;
    private $conversationsTable;
    
    public function __construct() {
        $this->client = new DynamoDbClient([
            'region' => 'ap-southeast-1',
            'version' => 'latest'
        ]);
        
        $this->messagesTable = $_ENV['DYNAMODB_MESSAGES_TABLE'] ?? 'jagasewa-messages-prod';
        $this->conversationsTable = $_ENV['DYNAMODB_CONVERSATIONS_TABLE'] ?? 'jagasewa-conversations-prod';
    }
    
    public function sendMessage($conversationId, $senderId, $receiverId, $message, $messageType = 'text') {
        $timestamp = time() * 1000; // milliseconds
        $ttl = time() + (30 * 24 * 60 * 60); // 30 days
        
        try {
            $result = $this->client->putItem([
                'TableName' => $this->messagesTable,
                'Item' => [
                    'conversation_id' => ['S' => $conversationId],
                    'timestamp' => ['N' => (string)$timestamp],
                    'sender_id' => ['S' => (string)$senderId],
                    'receiver_id' => ['S' => (string)$receiverId],
                    'message' => ['S' => $message],
                    'message_type' => ['S' => $messageType],
                    'is_read' => ['BOOL' => false],
                    'ttl' => ['N' => (string)$ttl]
                ]
            ]);
            
            $this->updateConversation($conversationId, $senderId, $receiverId, $message);
            
            return ['success' => true, 'timestamp' => $timestamp];
        } catch (AwsException $e) {
            error_log("DynamoDB Error: " . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    public function getMessages($conversationId, $limit = 50) {
        try {
            $result = $this->client->query([
                'TableName' => $this->messagesTable,
                'KeyConditionExpression' => 'conversation_id = :cid',
                'ExpressionAttributeValues' => [
                    ':cid' => ['S' => $conversationId]
                ],
                'ScanIndexForward' => false,
                'Limit' => $limit
            ]);
            
            $messages = [];
            foreach ($result['Items'] as $item) {
                $messages[] = [
                    'conversation_id' => $item['conversation_id']['S'],
                    'timestamp' => (int)$item['timestamp']['N'],
                    'sender_id' => $item['sender_id']['S'],
                    'receiver_id' => $item['receiver_id']['S'],
                    'message' => $item['message']['S'],
                    'message_type' => $item['message_type']['S'],
                    'is_read' => $item['is_read']['BOOL']
                ];
            }
            
            return array_reverse($messages);
        } catch (AwsException $e) {
            error_log("DynamoDB Error: " . $e->getMessage());
            return [];
        }
    }
    
    public function markAsRead($conversationId, $receiverId) {
        try {
            $result = $this->client->query([
                'TableName' => $this->messagesTable,
                'KeyConditionExpression' => 'conversation_id = :cid',
                'FilterExpression' => 'receiver_id = :rid AND is_read = :unread',
                'ExpressionAttributeValues' => [
                    ':cid' => ['S' => $conversationId],
                    ':rid' => ['S' => (string)$receiverId],
                    ':unread' => ['BOOL' => false]
                ]
            ]);
            
            foreach ($result['Items'] as $item) {
                $this->client->updateItem([
                    'TableName' => $this->messagesTable,
                    'Key' => [
                        'conversation_id' => $item['conversation_id'],
                        'timestamp' => $item['timestamp']
                    ],
                    'UpdateExpression' => 'SET is_read = :read',
                    'ExpressionAttributeValues' => [
                        ':read' => ['BOOL' => true]
                    ]
                ]);
            }
            
            return true;
        } catch (AwsException $e) {
            error_log("DynamoDB Error: " . $e->getMessage());
            return false;
        }
    }
    
    private function updateConversation($conversationId, $senderId, $receiverId, $lastMessage) {
        try {
            $this->client->putItem([
                'TableName' => $this->conversationsTable,
                'Item' => [
                    'conversation_id' => ['S' => $conversationId],
                    'user_id' => ['S' => (string)$senderId],
                    'other_user_id' => ['S' => (string)$receiverId],
                    'last_message' => ['S' => $lastMessage],
                    'updated_at' => ['N' => (string)(time() * 1000)]
                ]
            ]);
            
            $this->client->putItem([
                'TableName' => $this->conversationsTable,
                'Item' => [
                    'conversation_id' => ['S' => $conversationId],
                    'user_id' => ['S' => (string)$receiverId],
                    'other_user_id' => ['S' => (string)$senderId],
                    'last_message' => ['S' => $lastMessage],
                    'updated_at' => ['N' => (string)(time() * 1000)]
                ]
            ]);
        } catch (AwsException $e) {
            error_log("DynamoDB Conversation Update Error: " . $e->getMessage());
        }
    }
    
    public function getConversations($userId) {
        try {
            $result = $this->client->query([
                'TableName' => $this->conversationsTable,
                'IndexName' => 'UserIndex',
                'KeyConditionExpression' => 'user_id = :uid',
                'ExpressionAttributeValues' => [
                    ':uid' => ['S' => (string)$userId]
                ]
            ]);
            
            $conversations = [];
            foreach ($result['Items'] as $item) {
                $conversations[] = [
                    'conversation_id' => $item['conversation_id']['S'],
                    'other_user_id' => $item['other_user_id']['S'],
                    'last_message' => $item['last_message']['S'],
                    'updated_at' => (int)$item['updated_at']['N']
                ];
            }
            
            return $conversations;
        } catch (AwsException $e) {
            error_log("DynamoDB Error: " . $e->getMessage());
            return [];
        }
    }
}
?>