<?php
include_once '../config/cors.php';
setCorsHeaders();

header('Content-Type: text/plain');

echo "=== Landlord Dashboard Test ===\n";

// Test 1: Check if files exist
echo "1. File existence:\n";
echo "- dashboard.php: " . (file_exists('landlord/dashboard.php') ? 'EXISTS' : 'MISSING') . "\n";
echo "- Landlord.php: " . (file_exists('../models/Landlord.php') ? 'EXISTS' : 'MISSING') . "\n";

// Test 2: Check database connection
echo "\n2. Database connection:\n";
try {
    require_once '../config/database.php';
    $database = new Database();
    $conn = $database->getConnection();
    echo "- Database: CONNECTED\n";
} catch (Exception $e) {
    echo "- Database: ERROR - " . $e->getMessage() . "\n";
}

// Test 3: Check Landlord model
echo "\n3. Landlord model:\n";
try {
    require_once '../models/Landlord.php';
    $landlord = new Landlord($conn);
    echo "- Landlord model: LOADED\n";
    
    // Test method exists
    if (method_exists($landlord, 'getLandlordByUserId')) {
        echo "- getLandlordByUserId method: EXISTS\n";
    } else {
        echo "- getLandlordByUserId method: MISSING\n";
    }
} catch (Exception $e) {
    echo "- Landlord model: ERROR - " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
?>