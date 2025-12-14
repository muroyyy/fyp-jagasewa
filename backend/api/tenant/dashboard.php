<?php
include_once '../../config/cors.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../config/tenant_cache.php';

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

    // Verify session token
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role, t.tenant_id
        FROM sessions s
        JOIN tenants t ON s.user_id = t.user_id
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

    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    $tenant_id = $session['tenant_id'];
    $user_id = $session['user_id'];

    // Check cache first
    $cachedDashboard = TenantCache::get($tenant_id, 'dashboard');
    
    if ($cachedDashboard !== null) {
        $tenant = $cachedDashboard['tenant'];
        $payment_stats = $cachedDashboard['payment_stats'];
        $next_payment = $cachedDashboard['next_payment'];
        $maintenance_stats = $cachedDashboard['maintenance_stats'];
    } else {
        // Get tenant profile with property information
        $stmt = $conn->prepare("
            SELECT 
                t.tenant_id,
                t.full_name,
                t.phone,
                t.ic_number,
                t.date_of_birth,
                t.move_in_date,
                t.move_out_date,
                t.property_id,
                u.email,
                p.property_name,
                p.property_type,
                p.address,
                p.city,
                p.state,
                p.postal_code,
                p.monthly_rent,
                p.status as property_status,
                p.images as property_images,
                l.full_name as landlord_name,
                l.phone as landlord_phone,
                lu.email as landlord_email
            FROM tenants t
            JOIN users u ON t.user_id = u.user_id
            LEFT JOIN properties p ON t.property_id = p.property_id
            LEFT JOIN landlords l ON p.landlord_id = l.landlord_id
            LEFT JOIN users lu ON l.user_id = lu.user_id
            WHERE t.tenant_id = :tenant_id
        ");
        $stmt->bindParam(':tenant_id', $tenant_id);
        $stmt->execute();

        $tenant = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get payment and maintenance stats in one query
        $stmt = $conn->prepare("
            SELECT 
                COUNT(DISTINCT pay.payment_id) as total_payments,
                COALESCE(SUM(CASE WHEN pay.status = 'completed' THEN pay.amount ELSE 0 END), 0) as total_paid,
                MAX(pay.payment_date) as last_payment_date,
                COUNT(DISTINCT mr.request_id) as total_requests,
                SUM(CASE WHEN mr.status = 'pending' THEN 1 ELSE 0 END) as pending_requests,
                SUM(CASE WHEN mr.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_requests,
                SUM(CASE WHEN mr.status = 'completed' THEN 1 ELSE 0 END) as completed_requests
            FROM tenants t
            LEFT JOIN payments pay ON t.tenant_id = pay.tenant_id
            LEFT JOIN maintenance_requests mr ON t.tenant_id = mr.tenant_id
            WHERE t.tenant_id = :tenant_id
        ");
        $stmt->bindParam(':tenant_id', $tenant_id);
        $stmt->execute();
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$tenant) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Tenant profile not found'
            ]);
            exit();
        }

        $payment_stats = [
            'total_payments' => (int)$stats['total_payments'],
            'total_paid' => (float)$stats['total_paid'],
            'last_payment_date' => $stats['last_payment_date']
        ];

        $maintenance_stats = [
            'total_requests' => (int)$stats['total_requests'],
            'pending_requests' => (int)$stats['pending_requests'],
            'in_progress_requests' => (int)$stats['in_progress_requests'],
            'completed_requests' => (int)$stats['completed_requests']
        ];

        // Calculate next payment
        $next_payment = null;
        if ($tenant['property_id'] && $tenant['monthly_rent']) {
            $last_payment = $payment_stats['last_payment_date'];
            if ($last_payment) {
                $next_due = date('Y-m-d', strtotime($last_payment . ' +1 month'));
            } else {
                $move_in_date = $tenant['move_in_date'] ?: date('Y-m-d');
                $next_due = date('Y-m-d', strtotime($move_in_date . ' +1 month'));
            }
            
            $stmt = $conn->prepare("
                SELECT COUNT(*) as count
                FROM payments
                WHERE tenant_id = :tenant_id
                AND YEAR(payment_date) = YEAR(:next_due)
                AND MONTH(payment_date) = MONTH(:next_due)
                AND status = 'completed'
            ");
            $stmt->bindParam(':tenant_id', $tenant_id);
            $stmt->bindParam(':next_due', $next_due);
            $stmt->execute();
            $payment_check = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($payment_check['count'] == 0) {
                $next_payment = [
                    'amount' => $tenant['monthly_rent'],
                    'due_date' => $next_due,
                    'property_name' => $tenant['property_name']
                ];
            }
        }
        
        // Cache the results
        TenantCache::set($tenant_id, 'dashboard', [
            'tenant' => $tenant,
            'payment_stats' => $payment_stats,
            'next_payment' => $next_payment,
            'maintenance_stats' => $maintenance_stats
        ]);
    }

    // Prepare property information
    $property_info = null;
    if ($tenant['property_id']) {
        $property_images = [];
        if (!empty($tenant['property_images'])) {
            $property_images = json_decode($tenant['property_images'], true);
            if (!is_array($property_images)) {
                $property_images = [];
            }
        }
        
        $property_info = [
            'property_id' => $tenant['property_id'],
            'property_name' => $tenant['property_name'],
            'property_type' => $tenant['property_type'],
            'address' => $tenant['address'],
            'city' => $tenant['city'],
            'state' => $tenant['state'],
            'postal_code' => $tenant['postal_code'],
            'monthly_rent' => $tenant['monthly_rent'],
            'status' => $tenant['property_status'],
            'move_in_date' => $tenant['move_in_date'],
            'move_out_date' => $tenant['move_out_date'],
            'images' => $property_images,
            'landlord' => [
                'name' => $tenant['landlord_name'],
                'phone' => $tenant['landlord_phone'],
                'email' => $tenant['landlord_email']
            ]
        ];
    }

    // Prepare tenant profile
    $profile = [
        'tenant_id' => $tenant['tenant_id'],
        'full_name' => $tenant['full_name'],
        'email' => $tenant['email'],
        'phone' => $tenant['phone'],
        'ic_number' => $tenant['ic_number'],
        'date_of_birth' => $tenant['date_of_birth']
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
                'total_payments' => (int)$payment_stats['total_payments'],
                'total_paid' => (float)$payment_stats['total_paid'],
                'last_payment_date' => $payment_stats['last_payment_date'],
                'maintenance_total' => (int)$maintenance_stats['total_requests'],
                'maintenance_pending' => (int)$maintenance_stats['pending_requests'],
                'maintenance_in_progress' => (int)$maintenance_stats['in_progress_requests'],
                'maintenance_completed' => (int)$maintenance_stats['completed_requests']
            ]
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