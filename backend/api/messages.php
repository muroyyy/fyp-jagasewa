<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/auth_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$user = authenticate();

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

switch ($method) {
    case 'GET':
        if (isset($_GET['property_id'])) {
            getMessages($user, $_GET['property_id']);
        } else {
            getConversations($user);
        }
        break;
    case 'POST':
        sendMessage($user);
        break;
    case 'PUT':
        markAsRead($user);
        break;
}

function getMessages($user, $property_id) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT m.*, 
               sender.full_name as sender_name,
               receiver.full_name as receiver_name
        FROM messages m
        JOIN users sender ON m.sender_id = sender.user_id
        JOIN users receiver ON m.receiver_id = receiver.user_id
        WHERE m.property_id = ? 
        AND (m.sender_id = ? OR m.receiver_id = ?)
        ORDER BY m.created_at ASC
    ");
    
    $stmt->execute([$property_id, $user['user_id'], $user['user_id']]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['messages' => $messages]);
}

function getConversations($user) {
    global $pdo;
    
    $stmt = $pdo->prepare("
        SELECT DISTINCT 
            p.property_id,
            p.property_name,
            CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END as other_user_id,
            CASE 
                WHEN m.sender_id = ? THEN receiver.full_name 
                ELSE sender.full_name 
            END as other_user_name,
            (SELECT message FROM messages m2 
             WHERE m2.property_id = p.property_id 
             AND (m2.sender_id = ? OR m2.receiver_id = ?)
             ORDER BY m2.created_at DESC LIMIT 1) as last_message,
            (SELECT COUNT(*) FROM messages m3 
             WHERE m3.property_id = p.property_id 
             AND m3.receiver_id = ? AND m3.is_read = FALSE) as unread_count
        FROM messages m
        JOIN properties p ON m.property_id = p.property_id
        JOIN users sender ON m.sender_id = sender.user_id
        JOIN users receiver ON m.receiver_id = receiver.user_id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY m.created_at DESC
    ");
    
    $stmt->execute([
        $user['user_id'], $user['user_id'], $user['user_id'], 
        $user['user_id'], $user['user_id'], $user['user_id'], $user['user_id']
    ]);
    
    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['conversations' => $conversations]);
}

function sendMessage($user) {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("
        INSERT INTO messages (property_id, sender_id, receiver_id, message, message_type)
        VALUES (?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['property_id'],
        $user['user_id'],
        $data['receiver_id'],
        $data['message'],
        $data['message_type'] ?? 'text'
    ]);
    
    echo json_encode(['success' => true, 'message_id' => $pdo->lastInsertId()]);
}

function markAsRead($user) {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("
        UPDATE messages 
        SET is_read = TRUE 
        WHERE property_id = ? AND receiver_id = ?
    ");
    
    $stmt->execute([$data['property_id'], $user['user_id']]);
    
    echo json_encode(['success' => true]);
}
?>