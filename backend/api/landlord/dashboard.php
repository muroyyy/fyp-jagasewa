<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';
require_once '../../models/Landlord.php';
require_once '../../config/landlord_cache.php';

try {
    // Create database connection
    $database = new Database();
    $db = $database->getConnection();
    
    // Check authentication with session warning
    $user = authenticate(true); // Enable session warning check
    
    if (!$user || $user['role'] !== 'landlord') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $userId = $user['user_id'];
    
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
    
    // Check cache first
    $cachedStats = LandlordCache::get($landlordId, 'dashboard_stats');
    
    if ($cachedStats !== null) {
        $totalProperties = $cachedStats['total_properties'];
        $totalTenants = $cachedStats['total_tenants'];
        $monthlyRevenue = $cachedStats['monthly_revenue'];
        $pendingRequests = $cachedStats['pending_requests'];
        $totalExpenses = $cachedStats['total_expenses'];
        $propertyStatus = $cachedStats['property_status'];
    } else {
        // Consolidated query: Get all stats in one query
        $statsQuery = "
            SELECT 
                COUNT(DISTINCT CASE WHEN p.status = 'Active' THEN p.property_id END) as total_properties,
                COUNT(DISTINCT CASE WHEN p.status = 'Active' AND t.property_id IS NOT NULL THEN t.tenant_id END) as total_tenants,
                COALESCE(SUM(CASE WHEN p.status = 'Active' AND t.property_id IS NOT NULL THEN p.monthly_rent END), 0) as monthly_revenue,
                COUNT(DISTINCT CASE WHEN mr.status = 'Pending' THEN mr.request_id END) as pending_requests,
                COALESCE(SUM(mr.expense_amount), 0) as total_expenses,
                SUM(CASE WHEN p.status = 'occupied' THEN 1 ELSE 0 END) as status_occupied,
                SUM(CASE WHEN p.status = 'vacant' THEN 1 ELSE 0 END) as status_vacant,
                SUM(CASE WHEN p.status = 'maintenance' THEN 1 ELSE 0 END) as status_maintenance
            FROM properties p
            LEFT JOIN tenants t ON t.property_id = p.property_id
            LEFT JOIN maintenance_requests mr ON mr.property_id = p.property_id
            WHERE p.landlord_id = ?
        ";
        
        $statsStmt = $db->prepare($statsQuery);
        $statsStmt->execute([$landlordId]);
        $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
        
        $totalProperties = (int)$stats['total_properties'];
        $totalTenants = (int)$stats['total_tenants'];
        $monthlyRevenue = (float)$stats['monthly_revenue'];
        $pendingRequests = (int)$stats['pending_requests'];
        $totalExpenses = (float)$stats['total_expenses'];
        
        $propertyStatus = [
            'occupied' => (int)$stats['status_occupied'],
            'vacant' => (int)$stats['status_vacant'],
            'maintenance' => (int)$stats['status_maintenance']
        ];
        
        // Cache the results
        LandlordCache::set($landlordId, 'dashboard_stats', [
            'total_properties' => $totalProperties,
            'total_tenants' => $totalTenants,
            'monthly_revenue' => $monthlyRevenue,
            'pending_requests' => $pendingRequests,
            'total_expenses' => $totalExpenses,
            'property_status' => $propertyStatus
        ]);
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