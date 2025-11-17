<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/auth_helper.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

// Check authentication
$token = getBearerToken();
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized - No token provided']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if session exists
    $stmt = $db->prepare("SELECT user_id, user_role FROM sessions WHERE session_token = :token AND expires_at > NOW()");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(401);
        echo json_encode([
            'success' => false, 
            'message' => 'Unauthorized - Session not found or expired',
            'debug' => ['token_length' => strlen($token)]
        ]);
        exit;
    }
    
    $user = ['user_id' => $session['user_id'], 'role' => $session['user_role']];
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
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
    $database = new Database();
    $pdo = $database->getConnection();
    
    $stmt = $pdo->prepare("
        SELECT m.*, 
               COALESCE(sl.full_name, st.full_name, 'User') as sender_name,
               COALESCE(rl.full_name, rt.full_name, 'User') as receiver_name,
               COALESCE(sl.profile_image, st.profile_image) as sender_image,
               COALESCE(rl.profile_image, rt.profile_image) as receiver_image
        FROM messages m
        LEFT JOIN landlords sl ON m.sender_id = sl.user_id
        LEFT JOIN tenants st ON m.sender_id = st.user_id
        LEFT JOIN landlords rl ON m.receiver_id = rl.user_id
        LEFT JOIN tenants rt ON m.receiver_id = rt.user_id
        WHERE m.property_id = ? 
        AND (m.sender_id = ? OR m.receiver_id = ?)
        ORDER BY m.created_at ASC
    ");
    
    $stmt->execute([$property_id, $user['user_id'], $user['user_id']]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['messages' => $messages]);
}

function getConversations($user) {
    $database = new Database();
    $pdo = $database->getConnection();
    
    $stmt = $pdo->prepare("
        SELECT DISTINCT 
            p.property_id,
            p.property_name,
            CASE 
                WHEN m.sender_id = ? THEN m.receiver_id 
                ELSE m.sender_id 
            END as other_user_id,
            CASE 
                WHEN m.sender_id = ? THEN COALESCE(rl.full_name, rt.full_name, 'User')
                ELSE COALESCE(sl.full_name, st.full_name, 'User')
            END as other_user_name,
            CASE 
                WHEN m.sender_id = ? THEN COALESCE(rl.profile_image, rt.profile_image)
                ELSE COALESCE(sl.profile_image, st.profile_image)
            END as other_user_image,
            (SELECT message FROM messages m2 
             WHERE m2.property_id = p.property_id 
             AND (m2.sender_id = ? OR m2.receiver_id = ?)
             ORDER BY m2.created_at DESC LIMIT 1) as last_message,
            (SELECT COUNT(*) FROM messages m3 
             WHERE m3.property_id = p.property_id 
             AND m3.receiver_id = ? AND m3.is_read = FALSE) as unread_count
        FROM messages m
        JOIN properties p ON m.property_id = p.property_id
        LEFT JOIN landlords sl ON m.sender_id = sl.user_id
        LEFT JOIN tenants st ON m.sender_id = st.user_id
        LEFT JOIN landlords rl ON m.receiver_id = rl.user_id
        LEFT JOIN tenants rt ON m.receiver_id = rt.user_id
        WHERE m.sender_id = ? OR m.receiver_id = ?
        ORDER BY m.created_at DESC
    ");
    
    $stmt->execute([
        $user['user_id'], $user['user_id'], $user['user_id'], $user['user_id'], 
        $user['user_id'], $user['user_id'], $user['user_id'], $user['user_id']
    ]);
    
    $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['conversations' => $conversations]);
}

function sendMessage($user) {
    try {
        $database = new Database();
        $pdo = $database->getConnection();
        
        $raw_input = file_get_contents('php://input');
        $data = json_decode($raw_input, true);
        
        if (!$data) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid JSON', 'raw' => $raw_input, 'json_error' => json_last_error_msg()]);
            return;
        }
        
        if (!isset($data['property_id']) || !isset($data['receiver_id']) || !isset($data['message'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Missing required fields', 'received' => $data]);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO messages (property_id, sender_id, receiver_id, message, message_type)
            VALUES (?, ?, ?, ?, ?)
        ");
        
        $result = $stmt->execute([
            $data['property_id'],
            $user['user_id'],
            $data['receiver_id'],
            $data['message'],
            $data['message_type'] ?? 'text'
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message_id' => $pdo->lastInsertId()]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to insert message']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function markAsRead($user) {
    $database = new Database();
    $pdo = $database->getConnection();
    
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