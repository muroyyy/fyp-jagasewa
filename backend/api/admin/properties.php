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
    
    $user_data = ['user_id' => $session['user_id'], 'role' => $session['user_role']];

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get all properties with landlord information
        $query = "SELECT p.property_id, p.property_name, p.property_type, p.address, p.city, p.state, 
                         p.monthly_rent, p.status, p.images, p.created_at, p.updated_at,
                         l.full_name as landlord_name, u.email as landlord_email
                  FROM properties p
                  JOIN landlords l ON p.landlord_id = l.landlord_id
                  JOIN users u ON l.user_id = u.user_id
                  ORDER BY p.created_at DESC";
        
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Process images field
        foreach ($properties as &$property) {
            if ($property['images']) {
                $property['images'] = json_decode($property['images'], true);
            } else {
                $property['images'] = [];
            }
        }

        echo json_encode([
            'success' => true,
            'data' => $properties
        ]);

    } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
        // Update property status (moderate property)
        $input = json_decode(file_get_contents('php://input'), true);
        
        $property_id = $input['property_id'] ?? '';
        $status = $input['status'] ?? '';
        
        if (empty($property_id) || empty($status)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Property ID and status are required']);
            exit();
        }

        // Valid statuses
        $valid_statuses = ['available', 'occupied', 'maintenance', 'inactive'];
        if (!in_array($status, $valid_statuses)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid status']);
            exit();
        }

        // Update property status
        $query = "UPDATE properties SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE property_id = :property_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':property_id', $property_id, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            // Log admin action
            $log_query = "INSERT INTO admin_logs (admin_id, action, target_type, target_id, details) 
                          VALUES ((SELECT admin_id FROM admins WHERE user_id = :admin_user_id), 
                                  'update_property_status', 'property', :target_id, :details)";
            $log_stmt = $conn->prepare($log_query);
            $details = json_encode(['property_id' => $property_id, 'new_status' => $status]);
            
            $log_stmt->bindParam(':admin_user_id', $user_data['user_id']);
            $log_stmt->bindParam(':target_id', $property_id);
            $log_stmt->bindParam(':details', $details);
            $log_stmt->execute();

            echo json_encode([
                'success' => true,
                'message' => 'Property status updated successfully'
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Property not found']);
        }

    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>