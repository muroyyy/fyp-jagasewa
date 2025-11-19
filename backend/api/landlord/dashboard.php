<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../models/Landlord.php';

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check authentication
    $token = getBearerToken();
    if (empty($token)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit();
    }

    // Verify session token and check landlord role
    $stmt = $db->prepare("
        SELECT s.user_id, s.user_role 
        FROM sessions s 
        WHERE s.session_token = ? AND s.expires_at > NOW() AND s.user_role = 'landlord'
    ");
    $stmt->execute([$token]);
    $session = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$session) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $userId = $session['user_id'];
    
    // Get landlord profile information
    $landlordModel = new Landlord($db);
    $landlordProfile = $landlordModel->getLandlordByUserId($userId);
    
    if (!$landlordProfile) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Landlord profile not found"
        ]);
        exit();
    }
    
    $landlordId = $landlordProfile['landlord_id'];
    
    // Get dashboard statistics
    // Total Properties (only active ones)
    $propertiesQuery = "SELECT COUNT(*) as total FROM properties WHERE landlord_id = ? AND status = 'Active'";
    $propertiesStmt = $db->prepare($propertiesQuery);
    $propertiesStmt->execute([$landlordId]);
    $totalProperties = $propertiesStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total Tenants (count tenants in active properties)
    $tenantsQuery = "SELECT COUNT(DISTINCT t.tenant_id) as total FROM tenants t 
                     JOIN properties p ON t.property_id = p.property_id 
                     WHERE p.landlord_id = ? AND p.status = 'Active' AND t.property_id IS NOT NULL";
    $tenantsStmt = $db->prepare($tenantsQuery);
    $tenantsStmt->execute([$landlordId]);
    $totalTenants = $tenantsStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Monthly Revenue (sum of monthly rent from active properties with tenants)
    $revenueQuery = "SELECT COALESCE(SUM(p.monthly_rent), 0) as total FROM tenants t 
                     JOIN properties p ON t.property_id = p.property_id 
                     WHERE p.landlord_id = ? AND p.status = 'Active' AND t.property_id IS NOT NULL";
    $revenueStmt = $db->prepare($revenueQuery);
    $revenueStmt->execute([$landlordId]);
    $monthlyRevenue = $revenueStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Pending Maintenance Requests
    $maintenanceQuery = "SELECT COUNT(*) as total FROM maintenance_requests mr 
                         JOIN properties p ON mr.property_id = p.property_id 
                         WHERE p.landlord_id = ? AND mr.status = 'Pending'";
    $maintenanceStmt = $db->prepare($maintenanceQuery);
    $maintenanceStmt->execute([$landlordId]);
    $pendingRequests = $maintenanceStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Total Expenses (sum of maintenance expenses)
    $expensesQuery = "SELECT COALESCE(SUM(mr.expense_amount), 0) as total FROM maintenance_requests mr 
                      JOIN properties p ON mr.property_id = p.property_id 
                      WHERE p.landlord_id = ?";
    $expensesStmt = $db->prepare($expensesQuery);
    $expensesStmt->execute([$landlordId]);
    $totalExpenses = $expensesStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Property Status Distribution
    $statusQuery = "SELECT status, COUNT(*) as count FROM properties WHERE landlord_id = ? GROUP BY status";
    $statusStmt = $db->prepare($statusQuery);
    $statusStmt->execute([$landlordId]);
    $statusResults = $statusStmt->fetchAll(PDO::FETCH_ASSOC);
    
    $propertyStatus = [
        'occupied' => 0,
        'vacant' => 0,
        'maintenance' => 0
    ];
    
    foreach ($statusResults as $row) {
        $status = strtolower($row['status']);
        if (isset($propertyStatus[$status])) {
            $propertyStatus[$status] = (int)$row['count'];
        }
    }
    
    // Return successful response with profile data and statistics
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Dashboard data retrieved successfully",
        "data" => [
            "profile" => [
                "full_name" => $landlordProfile['full_name'],
                "email" => $landlordProfile['email'],
                "phone" => $landlordProfile['phone'],
                "company_name" => $landlordProfile['company_name']
            ],
            "stats" => [
                "total_properties" => (int)$totalProperties,
                "total_tenants" => (int)$totalTenants,
                "monthly_revenue" => (float)$monthlyRevenue,
                "pending_requests" => (int)$pendingRequests,
                "total_expenses" => (float)$totalExpenses,
                "property_status" => $propertyStatus
            ]
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Server error: " . $e->getMessage()
    ]);
}
?>