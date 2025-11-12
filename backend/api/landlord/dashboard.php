<?php
include_once '../../config/cors.php';
setCorsHeaders();

require_once '../../config/database.php';
require_once '../../config/auth_helper.php';

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

    // Verify token and check landlord role
    $user_data = verifyJWT($token);
    if (!$user_data || $user_data['role'] !== 'landlord') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Access denied']);
        exit();
    }
    
    $userId = $user_data['user_id'];
    
    // QUERY 1: Get landlord profile + ALL statistics in ONE query
    $stmt = $db->prepare("
        SELECT 
            -- Landlord profile
            l.landlord_id,
            l.full_name,
            l.phone,
            l.company_name,
            l.address,
            l.profile_image,
            u.email,
            
            -- Statistics using subqueries
            (SELECT COUNT(*) 
             FROM properties 
             WHERE landlord_id = l.landlord_id 
             AND status = 'Active'
            ) as total_properties,
            
            (SELECT COUNT(DISTINCT t.tenant_id) 
             FROM tenants t 
             JOIN properties p ON t.property_id = p.property_id 
             WHERE p.landlord_id = l.landlord_id 
             AND p.status = 'Active' 
             AND t.property_id IS NOT NULL
            ) as total_tenants,
            
            (SELECT COALESCE(SUM(p.monthly_rent), 0) 
             FROM tenants t 
             JOIN properties p ON t.property_id = p.property_id 
             WHERE p.landlord_id = l.landlord_id 
             AND p.status = 'Active' 
             AND t.property_id IS NOT NULL
            ) as monthly_revenue,
            
            (SELECT COUNT(*) 
             FROM maintenance_requests mr 
             JOIN properties p ON mr.property_id = p.property_id 
             WHERE p.landlord_id = l.landlord_id 
             AND mr.status = 'Pending'
            ) as pending_requests,
            
            -- Additional useful statistics
            (SELECT COUNT(*) 
             FROM properties 
             WHERE landlord_id = l.landlord_id 
             AND status = 'Inactive'
            ) as inactive_properties,
            
            (SELECT COUNT(*) 
             FROM maintenance_requests mr 
             JOIN properties p ON mr.property_id = p.property_id 
             WHERE p.landlord_id = l.landlord_id 
             AND mr.status = 'In Progress'
            ) as in_progress_requests,
            
            (SELECT COUNT(*) 
             FROM maintenance_requests mr 
             JOIN properties p ON mr.property_id = p.property_id 
             WHERE p.landlord_id = l.landlord_id 
             AND mr.status = 'Completed'
            ) as completed_requests
            
        FROM landlords l
        JOIN users u ON l.user_id = u.user_id
        WHERE l.user_id = :user_id
    ");
    
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    $data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$data) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Landlord profile not found"
        ]);
        exit();
    }
    
    // QUERY 2: Get recent activities (optional - can be added if needed)
    // For now, we have everything in 1 query
    
    // Return successful response with profile data and statistics
    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Dashboard data retrieved successfully",
        "data" => [
            "profile" => [
                "landlord_id" => $data['landlord_id'],
                "full_name" => $data['full_name'],
                "email" => $data['email'],
                "phone" => $data['phone'],
                "company_name" => $data['company_name'],
                "address" => $data['address'],
                "profile_image" => $data['profile_image']
            ],
            "stats" => [
                "total_properties" => (int)$data['total_properties'],
                "inactive_properties" => (int)$data['inactive_properties'],
                "total_tenants" => (int)$data['total_tenants'],
                "monthly_revenue" => (float)$data['monthly_revenue'],
                "pending_requests" => (int)$data['pending_requests'],
                "in_progress_requests" => (int)$data['in_progress_requests'],
                "completed_requests" => (int)$data['completed_requests']
            ]
        ],
        // Debug info (remove in production)
        "debug" => [
            "query_count" => 1,
            "optimization" => "Reduced from 6 queries to 1 query (83% improvement)"
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