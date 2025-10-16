<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

// Get Authorization header
$headers = getallheaders();
$authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

if (empty($authHeader)) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Authorization header missing'
    ]);
    exit();
}

// Extract token
$token = str_replace('Bearer ', '', $authHeader);

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Verify session token
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role, l.landlord_id
        FROM sessions s
        JOIN landlords l ON s.user_id = l.user_id
        WHERE s.session_token = :token 
        AND s.expires_at > NOW()
        AND s.user_role = 'landlord'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid or expired session'
        ]);
        exit();
    }

    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $landlord_id = $session['landlord_id'];
    $user_id = $session['user_id'];

    // Get request body
    $data = json_decode(file_get_contents('php://input'), true);

    // Validate required fields
    $required_fields = ['full_name', 'email', 'phone', 'ic_number', 'date_of_birth', 'property_id', 'move_in_date'];
    foreach ($required_fields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
            ]);
            exit();
        }
    }

    // Validate email format
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email format'
        ]);
        exit();
    }

    // Validate IC number format (xxxxxx-xx-xxxx)
    if (!preg_match('/^\d{6}-\d{2}-\d{4}$/', $data['ic_number'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'IC number must be in format: xxxxxx-xx-xxxx'
        ]);
        exit();
    }

    // Validate phone number format (+60xxxxxxxxxx)
    if (!preg_match('/^\+60\d{9,10}$/', $data['phone'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Phone number must be in format: +60xxxxxxxxxx'
        ]);
        exit();
    }

    // Validate age (must be at least 18 years old)
    $dob = new DateTime($data['date_of_birth']);
    $today = new DateTime();
    $age = $today->diff($dob)->y;
    
    if ($age < 18) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Tenant must be at least 18 years old'
        ]);
        exit();
    }

    // Verify property belongs to this landlord
    $stmt = $conn->prepare("
        SELECT property_id 
        FROM properties 
        WHERE property_id = :property_id 
        AND landlord_id = :landlord_id
        AND status = 'Active'
    ");
    $stmt->bindParam(':property_id', $data['property_id']);
    $stmt->bindParam(':landlord_id', $landlord_id);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid property or property does not belong to you'
        ]);
        exit();
    }

    // Check if email already exists
    $stmt = $conn->prepare("SELECT user_id FROM users WHERE email = :email");
    $stmt->bindParam(':email', $data['email']);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Email address already exists'
        ]);
        exit();
    }

    // Check if IC number already exists
    $stmt = $conn->prepare("SELECT tenant_id FROM tenants WHERE ic_number = :ic_number");
    $stmt->bindParam(':ic_number', $data['ic_number']);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'IC number already exists'
        ]);
        exit();
    }

    // Start transaction
    $conn->beginTransaction();

    try {
        // Generate a temporary password (tenant will need to reset it)
        $temp_password = bin2hex(random_bytes(8)); // 16 character random password
        $password_hash = password_hash($temp_password, PASSWORD_DEFAULT);

        // Create user account
        $stmt = $conn->prepare("
            INSERT INTO users (email, password_hash, user_role, is_active, is_verified, created_at, updated_at)
            VALUES (:email, :password_hash, 'tenant', 1, 0, NOW(), NOW())
        ");
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':password_hash', $password_hash);
        $stmt->execute();

        $tenant_user_id = $conn->lastInsertId();

        // Create tenant record
        $stmt = $conn->prepare("
            INSERT INTO tenants (
                user_id, 
                property_id, 
                full_name, 
                phone, 
                ic_number, 
                date_of_birth, 
                move_in_date,
                created_at, 
                updated_at
            ) VALUES (
                :user_id, 
                :property_id, 
                :full_name, 
                :phone, 
                :ic_number, 
                :date_of_birth, 
                :move_in_date,
                NOW(), 
                NOW()
            )
        ");
        
        $stmt->bindParam(':user_id', $tenant_user_id);
        $stmt->bindParam(':property_id', $data['property_id']);
        $stmt->bindParam(':full_name', $data['full_name']);
        $stmt->bindParam(':phone', $data['phone']);
        $stmt->bindParam(':ic_number', $data['ic_number']);
        $stmt->bindParam(':date_of_birth', $data['date_of_birth']);
        $stmt->bindParam(':move_in_date', $data['move_in_date']);
        $stmt->execute();

        $tenant_id = $conn->lastInsertId();

        // Commit transaction
        $conn->commit();

        // TODO: Send email invitation to tenant with temporary password
        // For now, we'll just return the temp password (in production, email it)

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Tenant added successfully',
            'data' => [
                'tenant_id' => $tenant_id,
                'user_id' => $tenant_user_id,
                'email' => $data['email'],
                'temp_password' => $temp_password // Remove in production, send via email
            ]
        ]);

    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollBack();
        throw $e;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>