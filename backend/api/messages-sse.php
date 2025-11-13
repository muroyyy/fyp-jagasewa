<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/auth_helper.php';

setCorsHeaders();

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

$user = authenticate();
if (!$user) {
    echo "event: error\n";
    echo "data: Unauthorized\n\n";
    exit;
}

$property_id = $_GET['property_id'] ?? null;
if (!$property_id) {
    echo "event: error\n";
    echo "data: Property ID required\n\n";
    exit;
}

$last_message_id = $_GET['last_message_id'] ?? 0;

$database = new Database();
$pdo = $database->getConnection();

while (true) {
    // Check for new messages
    $stmt = $pdo->prepare("
        SELECT m.*, sender.full_name as sender_name
        FROM messages m
        JOIN users sender ON m.sender_id = sender.user_id
        WHERE m.property_id = ? 
        AND m.message_id > ?
        AND (m.sender_id = ? OR m.receiver_id = ?)
        ORDER BY m.created_at ASC
    ");
    
    $stmt->execute([$property_id, $last_message_id, $user['user_id'], $user['user_id']]);
    $new_messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (!empty($new_messages)) {
        foreach ($new_messages as $message) {
            echo "event: new_message\n";
            echo "data: " . json_encode($message) . "\n\n";
            $last_message_id = $message['message_id'];
        }
        ob_flush();
        flush();
    }
    
    // Check for connection
    if (connection_aborted()) {
        break;
    }
    
    sleep(2); // Poll every 2 seconds
}
?>