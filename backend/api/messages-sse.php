<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/auth_helper.php';

setCorsHeaders();

header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

$token = $_GET['token'] ?? '';
if (empty($token)) {
    echo "event: error\n";
    echo "data: Unauthorized\n\n";
    exit;
}

$database = new Database();
$pdo = $database->getConnection();

$stmt = $pdo->prepare("
    SELECT s.user_id, s.user_role 
    FROM sessions s 
    WHERE s.session_token = :token AND s.expires_at > NOW()
");
$stmt->bindParam(':token', $token);
$stmt->execute();
$session = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$session) {
    echo "event: error\n";
    echo "data: Unauthorized\n\n";
    exit;
}

$user = ['user_id' => $session['user_id'], 'role' => $session['user_role']];

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