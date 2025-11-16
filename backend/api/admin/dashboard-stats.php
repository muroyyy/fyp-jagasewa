<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

try {
    $database = new Database();
    $conn = $database->getConnection();

    // Check authentication
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Verify session token and check admin role
    $stmt = $conn->prepare("
        SELECT s.user_id, s.user_role 
        FROM sessions s 
        WHERE s.session_token = :token AND s.expires_at > NOW() AND s.user_role = 'admin'
    ");
    $stmt->bindParam(':token', $token);
    $stmt->execute();
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }

    // Get total users
    $users_query = "SELECT COUNT(*) as total_users FROM users WHERE is_active = 1";
    $users_stmt = $conn->prepare($users_query);
    $users_stmt->execute();
    $total_users = $users_stmt->fetch(PDO::FETCH_ASSOC)['total_users'];

    // Get landlords count
    $landlords_query = "SELECT COUNT(*) as total_landlords FROM users WHERE user_role = 'landlord' AND is_active = 1";
    $landlords_stmt = $conn->prepare($landlords_query);
    $landlords_stmt->execute();
    $total_landlords = $landlords_stmt->fetch(PDO::FETCH_ASSOC)['total_landlords'];

    // Get tenants count
    $tenants_query = "SELECT COUNT(*) as total_tenants FROM users WHERE user_role = 'tenant' AND is_active = 1";
    $tenants_stmt = $conn->prepare($tenants_query);
    $tenants_stmt->execute();
    $total_tenants = $tenants_stmt->fetch(PDO::FETCH_ASSOC)['total_tenants'];

    // Get total properties
    $properties_query = "SELECT COUNT(*) as total_properties FROM properties";
    $properties_stmt = $conn->prepare($properties_query);
    $properties_stmt->execute();
    $total_properties = $properties_stmt->fetch(PDO::FETCH_ASSOC)['total_properties'];

    // Get active rentals
    $rentals_query = "SELECT COUNT(*) as active_rentals FROM tenants WHERE property_id IS NOT NULL";
    $rentals_stmt = $conn->prepare($rentals_query);
    $rentals_stmt->execute();
    $active_rentals = $rentals_stmt->fetch(PDO::FETCH_ASSOC)['active_rentals'];

    // Calculate monthly revenue (sum of all monthly rents for occupied properties)
    $revenue_query = "SELECT SUM(p.monthly_rent) as monthly_revenue 
                      FROM properties p 
                      JOIN tenants t ON p.property_id = t.property_id 
                      WHERE t.property_id IS NOT NULL";
    $revenue_stmt = $conn->prepare($revenue_query);
    $revenue_stmt->execute();
    $monthly_revenue = $revenue_stmt->fetch(PDO::FETCH_ASSOC)['monthly_revenue'] ?? 0;

    // Get pending verifications
    $pending_query = "SELECT COUNT(*) as pending_verifications FROM users WHERE is_verified = 0";
    $pending_stmt = $conn->prepare($pending_query);
    $pending_stmt->execute();
    $pending_verifications = $pending_stmt->fetch(PDO::FETCH_ASSOC)['pending_verifications'];

    echo json_encode([
        'success' => true,
        'data' => [
            'totalUsers' => (int)$total_users,
            'totalLandlords' => (int)$total_landlords,
            'totalTenants' => (int)$total_tenants,
            'totalProperties' => (int)$total_properties,
            'activeRentals' => (int)$active_rentals,
            'monthlyRevenue' => (float)$monthly_revenue,
            'pendingVerifications' => (int)$pending_verifications,
            'systemUptime' => '99.9%'
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>