<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Get all properties with images
    $query = "SELECT property_id, images FROM properties WHERE images IS NOT NULL";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $images = json_decode($row['images'], true);
        if (!$images) continue;
        
        $cleanImages = [];
        foreach ($images as $image) {
            // Keep only S3 URLs, remove local paths
            if (strpos($image, 'https://jagasewa-assets-prod.s3.') === 0) {
                $cleanImages[] = $image;
            } else {
                echo "Removing local image: $image from property {$row['property_id']}\n";
            }
        }
        
        // Update database
        if (empty($cleanImages)) {
            $updateQuery = "UPDATE properties SET images = NULL WHERE property_id = :property_id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(':property_id', $row['property_id']);
        } else {
            $updateQuery = "UPDATE properties SET images = :images WHERE property_id = :property_id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindParam(':images', json_encode($cleanImages));
            $updateStmt->bindParam(':property_id', $row['property_id']);
        }
        
        $updateStmt->execute();
        echo "Updated property {$row['property_id']}\n";
    }
    
    echo "Cleanup completed!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>