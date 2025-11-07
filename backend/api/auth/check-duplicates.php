<?php
require_once '../config/cors.php';
require_once '../config/database.php';

setCorsHeaders();

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }

    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $ic_number = $input['ic_number'] ?? '';
    $user_role = $input['user_role'] ?? '';

    if (empty($email)) {
        throw new Exception('Email is required');
    }

    $database = new Database();
    $db = $database->getConnection();

    // Check for duplicate email in users table
    $emailQuery = "SELECT user_id FROM users WHERE email = ? LIMIT 1";
    $emailStmt = $db->prepare($emailQuery);
    $emailStmt->execute([$email]);
    
    if ($emailStmt->rowCount() > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Email address is already registered. Please use a different email or try logging in.'
        ]);
        exit;
    }

    // Check for duplicate phone number
    if (!empty($phone)) {
        if ($user_role === 'tenant') {
            $phoneQuery = "SELECT tenant_id FROM tenants WHERE phone = ? LIMIT 1";
        } else {
            $phoneQuery = "SELECT landlord_id FROM landlords WHERE phone = ? LIMIT 1";
        }
        
        $phoneStmt = $db->prepare($phoneQuery);
        $phoneStmt->execute([$phone]);
        
        if ($phoneStmt->rowCount() > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Phone number is already registered. Please use a different phone number.'
            ]);
            exit;
        }
    }

    // Check for duplicate IC number (only for tenants)
    if ($user_role === 'tenant' && !empty($ic_number)) {
        $icQuery = "SELECT tenant_id FROM tenants WHERE ic_number = ? LIMIT 1";
        $icStmt = $db->prepare($icQuery);
        $icStmt->execute([$ic_number]);
        
        if ($icStmt->rowCount() > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'IC number is already registered. Please check your IC number or contact support.'
            ]);
            exit;
        }
    }

    // No duplicates found
    echo json_encode([
        'success' => true,
        'message' => 'No duplicates found'
    ]);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>