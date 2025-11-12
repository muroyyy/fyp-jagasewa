<?php
include_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

// Get authorization token using helper function
$token = getBearerToken();

if (empty($token)) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Authorization header missing'
    ]);
    exit();
}

try {
    $database = new Database();
    $conn = $database->getConnection();

    // ✅ OPTIMIZED QUERY 1: Combine session check + ALL tenant/property/landlord data + statistics
    $stmt = $conn->prepare("
        SELECT 
            -- Session data
            s.user_id,
            s.user_role,
            
            -- Tenant info
            t.tenant_id,
            t.full_name,
            t.phone,
            t.ic_number,
            t.date_of_birth,
            t.move_in_date,
            t.property_id,
            
            -- User info
            u.email,
            
            -- Property info
            p.property_name,
            p.property_type,
            p.address,
            p.city,
            p.state,
            p.postal_code,
            p.monthly_rent,
            p.status as property_status,
            
            -- Landlord info
            l.full_name as landlord_name,
            l.phone as landlord_phone,
            lu.email as landlord_email,
            
            -- Payment statistics (using subqueries)
            (SELECT COUNT(*) 
             FROM payments 
             WHERE tenant_id = t.tenant_id
            ) as total_payments,
            
            (SELECT COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0)
             FROM payments 
             WHERE tenant_id = t.tenant_id
            ) as total_paid,
            
            (SELECT MAX(payment_date) 
             FROM payments 
             WHERE tenant_id = t.tenant_id
            ) as last_payment_date,
            
            -- Maintenance statistics (using subqueries)
            (SELECT COUNT(*) 
             FROM maintenance_requests 
             WHERE tenant_id = t.tenant_id
            ) as maintenance_total,
            
            (SELECT COUNT(*) 
             FROM maintenance_requests 
             WHERE tenant_id = t.tenant_id AND status = 'pending'
            ) as maintenance_pending,
            
            (SELECT COUNT(*) 
             FROM maintenance_requests 
             WHERE tenant_id = t.tenant_id AND status = 'in_progress'
            ) as maintenance_in_progress,
            
            (SELECT COUNT(*) 
             FROM maintenance_requests 
             WHERE tenant_id = t.tenant_id AND status = 'completed'
            ) as maintenance_completed
            
        FROM sessions s
        JOIN tenants t ON s.user_id = t.user_id
        JOIN users u ON t.user_id = u.user_id
        LEFT JOIN properties p ON t.property_id = p.property_id
        LEFT JOIN landlords l ON p.landlord_id = l.landlord_id
        LEFT JOIN users lu ON l.user_id = lu.user_id
        WHERE s.session_token = :token 
        AND s.expires_at > NOW()
        AND s.user_role = 'tenant'
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

    $data = $stmt->fetch(PDO::FETCH_ASSOC);

    // ✅ OPTIMIZED QUERY 2: Only check if payment exists for current month
    $next_payment = null;
    if ($data['property_id'] && $data['monthly_rent']) {
        // Calculate next payment date
        $last_payment = $data['last_payment_date'];
        if ($last_payment) {
            $next_due = date('Y-m-d', strtotime($last_payment . ' +1 month'));
        } else {
            $move_in_date = $data['move_in_date'] ?: date('Y-m-d');
            $next_due = date('Y-m-d', strtotime($move_in_date . ' +1 month'));
        }
        
        // Check if payment already made for this month
        $stmt = $conn->prepare("
            SELECT COUNT(*) as count
            FROM payments
            WHERE tenant_id = :tenant_id
            AND YEAR(payment_date) = YEAR(:next_due)
            AND MONTH(payment_date) = MONTH(:next_due)
            AND status = 'completed'
        ");
        $stmt->bindParam(':tenant_id', $data['tenant_id']);
        $stmt->bindParam(':next_due', $next_due);
        $stmt->execute();
        $payment_check = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($payment_check['count'] == 0) {
            $next_payment = [
                'amount' => $data['monthly_rent'],
                'due_date' => $next_due,
                'property_name' => $data['property_name']
            ];
        }
    }

    // Prepare property information
    $property_info = null;
    if ($data['property_id']) {
        $property_info = [
            'property_id' => $data['property_id'],
            'property_name' => $data['property_name'],
            'property_type' => $data['property_type'],
            'address' => $data['address'],
            'city' => $data['city'],
            'state' => $data['state'],
            'postal_code' => $data['postal_code'],
            'monthly_rent' => $data['monthly_rent'],
            'status' => $data['property_status'],
            'move_in_date' => $data['move_in_date'],
            'landlord' => [
                'name' => $data['landlord_name'],
                'phone' => $data['landlord_phone'],
                'email' => $data['landlord_email']
            ]
        ];
    }

    // Prepare tenant profile
    $profile = [
        'tenant_id' => $data['tenant_id'],
        'full_name' => $data['full_name'],
        'email' => $data['email'],
        'phone' => $data['phone'],
        'ic_number' => $data['ic_number'],
        'date_of_birth' => $data['date_of_birth']
    ];

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Tenant dashboard data retrieved successfully',
        'data' => [
            'profile' => $profile,
            'property' => $property_info,
            'next_payment' => $next_payment,
            'stats' => [
                'total_payments' => (int)$data['total_payments'],
                'total_paid' => (float)$data['total_paid'],
                'last_payment_date' => $data['last_payment_date'],
                'maintenance_total' => (int)$data['maintenance_total'],
                'maintenance_pending' => (int)$data['maintenance_pending'],
                'maintenance_in_progress' => (int)$data['maintenance_in_progress'],
                'maintenance_completed' => (int)$data['maintenance_completed']
            ]
        ],
        // Debug info (remove in production)
        'debug' => [
            'query_count' => 2,
            'optimization' => '60% reduction from 5 queries to 2 queries'
        ]
    ]);

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