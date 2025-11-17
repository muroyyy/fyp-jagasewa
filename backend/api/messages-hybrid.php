<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/auth_helper.php';
require_once '../config/dynamodb_helper.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

$token = getBearerToken();
if (empty($token)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    $stmt = $db->prepare("SELECT user_id, user_role FROM sessions WHERE session_token = :token AND expires_at > NOW()");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Session expired']);
        exit;
    }
    
    $user = ['user_id' => $session['user_id'], 'role' => $session['user_role']];
    $dynamodb = new DynamoDBHelper();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
    exit;
}

switch ($method) {
    case 'GET':
        if (isset($_GET['property_id'])) {
            getMessages($user, $_GET['property_id'], $db, $dynamodb);
        } else {
            getConversations($user, $db, $dynamodb);
        }
        break;
    case 'POST':
        sendMessage($user, $db, $dynamodb);
        break;
    case 'PUT':
        markAsRead($user, $dynamodb);
        break;
}

function getMessages($user, $property_id, $db, $dynamodb) {
    // For new conversations, we need to determine the other user from the property
    // Get property details to find the other participant
    $stmt = $db->prepare("
        SELECT p.landlord_id, l.user_id as landlord_user_id
        FROM properties p
        JOIN landlords l ON p.landlord_id = l.landlord_id
        WHERE p.property_id = ?
    ");
    $stmt->execute([$property_id]);
    $property = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$property) {
        echo json_encode(['messages' => []]);
        return;
    }
    
    // Determine the other user (if current user is landlord, find tenant; if tenant, use landlord)
    $other_user_id = null;
    if ($user['role'] === 'landlord') {
        // Find tenant for this property
        $stmt = $db->prepare("
            SELECT t.user_id 
            FROM tenants t 
            JOIN properties p ON t.tenant_id = p.tenant_id 
            WHERE p.property_id = ?
        ");
        $stmt->execute([$property_id]);
        $tenant = $stmt->fetch(PDO::FETCH_ASSOC);
        $other_user_id = $tenant['user_id'] ?? null;
    } else {
        // Current user is tenant, other user is landlord
        $other_user_id = $property['landlord_user_id'];
    }
    
    if (!$other_user_id) {
        echo json_encode(['messages' => []]);
        return;
    }
    
    $conversationId = "property_{$property_id}_" . min($user['user_id'], $other_user_id) . "_" . max($user['user_id'], $other_user_id);
    error_log("Getting messages for conversation: $conversationId");
    $messages = $dynamodb->getMessages($conversationId);
    error_log("Retrieved " . count($messages) . " messages from DynamoDB");
    
    // Get user details from MySQL
    $userIds = array_unique(array_merge(
        array_column($messages, 'sender_id'),
        array_column($messages, 'receiver_id')
    ));
    
    $userDetails = [];
    if (!empty($userIds)) {
        $placeholders = str_repeat('?,', count($userIds) - 1) . '?';
        $stmt = $db->prepare("
            SELECT u.user_id, 
                   COALESCE(l.full_name, t.full_name, 'User') as full_name,
                   COALESCE(l.profile_image, t.profile_image) as profile_image
            FROM users u
            LEFT JOIN landlords l ON u.user_id = l.user_id
            LEFT JOIN tenants t ON u.user_id = t.user_id
            WHERE u.user_id IN ($placeholders)
        ");
        $stmt->execute($userIds);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($users as $u) {
            $userDetails[$u['user_id']] = $u;
        }
    }
    
    // Enhance messages with user details
    foreach ($messages as &$message) {
        $message['sender_name'] = $userDetails[$message['sender_id']]['full_name'] ?? 'User';
        $message['sender_image'] = $userDetails[$message['sender_id']]['profile_image'] ?? null;
        $message['receiver_name'] = $userDetails[$message['receiver_id']]['full_name'] ?? 'User';
        $message['receiver_image'] = $userDetails[$message['receiver_id']]['profile_image'] ?? null;
    }
    
    echo json_encode(['messages' => $messages]);
}

function getConversations($user, $db, $dynamodb) {
    $conversations = $dynamodb->getConversations($user['user_id']);
    
    // Get property and user details from MySQL
    foreach ($conversations as &$conv) {
        // Extract property_id from conversation_id
        if (preg_match('/property_(\d+)_/', $conv['conversation_id'], $matches)) {
            $property_id = $matches[1];
            
            // Get property details
            $stmt = $db->prepare("SELECT property_name FROM properties WHERE property_id = ?");
            $stmt->execute([$property_id]);
            $property = $stmt->fetch(PDO::FETCH_ASSOC);
            $conv['property_name'] = $property['property_name'] ?? 'Unknown Property';
            $conv['property_id'] = $property_id;
        }
        
        // Get other user details
        $stmt = $db->prepare("
            SELECT COALESCE(l.full_name, t.full_name, 'User') as full_name,
                   COALESCE(l.profile_image, t.profile_image) as profile_image
            FROM users u
            LEFT JOIN landlords l ON u.user_id = l.user_id
            LEFT JOIN tenants t ON u.user_id = t.user_id
            WHERE u.user_id = ?
        ");
        $stmt->execute([$conv['other_user_id']]);
        $otherUser = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $conv['other_user_name'] = $otherUser['full_name'] ?? 'User';
        $conv['other_user_image'] = $otherUser['profile_image'] ?? null;
    }
    
    echo json_encode(['conversations' => $conversations]);
}

function sendMessage($user, $db, $dynamodb) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['property_id']) || !isset($data['receiver_id']) || !isset($data['message'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        return;
    }
    
    $conversationId = "property_{$data['property_id']}_" . min($user['user_id'], $data['receiver_id']) . "_" . max($user['user_id'], $data['receiver_id']);
    
    $result = $dynamodb->sendMessage(
        $conversationId,
        $user['user_id'],
        $data['receiver_id'],
        $data['message'],
        $data['message_type'] ?? 'text'
    );
    
    if ($result['success']) {
        echo json_encode(['success' => true, 'timestamp' => $result['timestamp']]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $result['error']]);
    }
}

function markAsRead($user, $dynamodb) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['property_id']) || !isset($data['other_user_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        return;
    }
    
    $conversationId = "property_{$data['property_id']}_" . min($user['user_id'], $data['other_user_id']) . "_" . max($user['user_id'], $data['other_user_id']);
    
    $result = $dynamodb->markAsRead($conversationId, $user['user_id']);
    echo json_encode(['success' => $result]);
}
?>