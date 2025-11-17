<?php
require_once 'config/dynamodb_helper.php';

// Test script for hybrid messaging
echo "Testing DynamoDB Hybrid Messaging...\n\n";

try {
    $dynamodb = new DynamoDBHelper();
    
    // Test sending a message
    echo "1. Testing sendMessage...\n";
    $result = $dynamodb->sendMessage(
        'property_1_1_2', // conversation_id
        '1', // sender_id
        '2', // receiver_id
        'Hello from hybrid messaging!',
        'text'
    );
    
    if ($result['success']) {
        echo "✓ Message sent successfully. Timestamp: " . $result['timestamp'] . "\n";
    } else {
        echo "✗ Failed to send message: " . $result['error'] . "\n";
    }
    
    // Test getting messages
    echo "\n2. Testing getMessages...\n";
    $messages = $dynamodb->getMessages('property_1_1_2');
    echo "Retrieved " . count($messages) . " messages\n";
    
    foreach ($messages as $msg) {
        echo "- From {$msg['sender_id']} to {$msg['receiver_id']}: {$msg['message']}\n";
    }
    
    // Test getting conversations
    echo "\n3. Testing getConversations...\n";
    $conversations = $dynamodb->getConversations('1');
    echo "Found " . count($conversations) . " conversations for user 1\n";
    
    foreach ($conversations as $conv) {
        echo "- Conversation: {$conv['conversation_id']} with user {$conv['other_user_id']}\n";
        echo "  Last message: {$conv['last_message']}\n";
    }
    
    echo "\n✓ All tests completed successfully!\n";
    
} catch (Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
}
?>