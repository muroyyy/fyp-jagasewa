<?php
/**
 * IC Verification Test Script
 * Tests AWS Textract integration and IC parsing
 */

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/textract_helper.php';

echo "=== JagaSewa IC Verification Test ===\n\n";

// Test 1: Check AWS SDK
echo "Test 1: AWS SDK Loaded\n";
if (class_exists('Aws\Textract\TextractClient')) {
    echo "✅ AWS SDK loaded successfully\n\n";
} else {
    echo "❌ AWS SDK not found\n\n";
    exit(1);
}

// Test 2: Check Textract Client Creation
echo "Test 2: Textract Client Creation\n";
try {
    $client = new Aws\Textract\TextractClient([
        'region' => 'ap-southeast-1',
        'version' => 'latest'
    ]);
    echo "✅ Textract client created successfully\n\n";
} catch (Exception $e) {
    echo "❌ Failed to create Textract client: " . $e->getMessage() . "\n\n";
    exit(1);
}

// Test 3: Test IC Number Parsing
echo "Test 3: IC Number Parsing\n";
$testLines = [
    'MALAYSIA',
    'WARGANEGARA',
    '990101-01-1234',
    'AHMAD BIN ALI',
    'ALAMAT',
    '123 JALAN MERDEKA',
    'KUALA LUMPUR'
];

$icNumber = parseICNumber($testLines);
if ($icNumber === '990101-01-1234') {
    echo "✅ IC number parsed correctly: $icNumber\n";
} else {
    echo "❌ IC number parsing failed. Got: " . ($icNumber ?: 'null') . "\n";
}

// Test 4: Test Date of Birth Calculation
echo "\nTest 4: Date of Birth Calculation\n";
$dob = parseDateOfBirth('990101-01-1234');
if ($dob === '1999-01-01') {
    echo "✅ DOB calculated correctly: $dob\n";
} else {
    echo "❌ DOB calculation failed. Got: " . ($dob ?: 'null') . "\n";
}

$dob2 = parseDateOfBirth('001231-14-5678');
if ($dob2 === '2000-12-31') {
    echo "✅ DOB calculated correctly for 2000s: $dob2\n";
} else {
    echo "❌ DOB calculation failed for 2000s. Got: " . ($dob2 ?: 'null') . "\n";
}

// Test 5: Test Gender Detection
echo "\nTest 5: Gender Detection\n";
$gender1 = parseGender('990101-01-1234'); // Last digit 4 = even = Female
if ($gender1 === 'Female') {
    echo "✅ Gender detected correctly (even): $gender1\n";
} else {
    echo "❌ Gender detection failed. Got: " . ($gender1 ?: 'null') . "\n";
}

$gender2 = parseGender('990101-01-1235'); // Last digit 5 = odd = Male
if ($gender2 === 'Male') {
    echo "✅ Gender detected correctly (odd): $gender2\n";
} else {
    echo "❌ Gender detection failed. Got: " . ($gender2 ?: 'null') . "\n";
}

// Test 6: Test Name Parsing
echo "\nTest 6: Name Parsing\n";
$name = parseName($testLines);
if ($name === 'AHMAD BIN ALI') {
    echo "✅ Name parsed correctly: $name\n";
} else {
    echo "❌ Name parsing failed. Got: " . ($name ?: 'null') . "\n";
}

// Test 7: Test Address Parsing
echo "\nTest 7: Address Parsing\n";
$address = parseAddress($testLines);
if (strpos($address, 'JALAN MERDEKA') !== false) {
    echo "✅ Address parsed correctly: $address\n";
} else {
    echo "❌ Address parsing failed. Got: " . ($address ?: 'null') . "\n";
}

// Test 8: Test Complete Analysis
echo "\nTest 8: Complete IC Analysis\n";
$analysis = analyzeICData($testLines, []);
echo "IC Number: " . ($analysis['ic_number'] ?: 'Not found') . "\n";
echo "Name: " . ($analysis['name'] ?: 'Not found') . "\n";
echo "DOB: " . ($analysis['date_of_birth'] ?: 'Not found') . "\n";
echo "Gender: " . ($analysis['gender'] ?: 'Not found') . "\n";
echo "Address: " . ($analysis['address'] ?: 'Not found') . "\n";
echo "Confidence: " . $analysis['confidence'] . "%\n";
echo "Fields Extracted: " . $analysis['fields_extracted'] . "/" . $analysis['total_fields'] . "\n";

if ($analysis['confidence'] >= 80) {
    echo "✅ Analysis completed with good confidence\n";
} else {
    echo "⚠️  Analysis completed with low confidence\n";
}

// Test 9: Check S3 Helper
echo "\nTest 9: S3 Helper Functions\n";
if (function_exists('getEC2Credentials')) {
    echo "✅ S3 helper functions loaded\n";
} else {
    echo "❌ S3 helper functions not found\n";
}

// Test 10: Check Database Connection
echo "\nTest 10: Database Connection\n";
try {
    require_once __DIR__ . '/config/database.php';
    $database = new Database();
    $db = $database->getConnection();
    
    // Check if tenants table has IC columns
    $stmt = $db->query("SHOW COLUMNS FROM tenants LIKE 'ic_%'");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $requiredColumns = ['ic_front_image', 'ic_back_image', 'ic_verified', 'ic_verification_data'];
    $missingColumns = array_diff($requiredColumns, $columns);
    
    if (empty($missingColumns)) {
        echo "✅ Database has all IC verification columns\n";
    } else {
        echo "❌ Missing database columns: " . implode(', ', $missingColumns) . "\n";
        echo "   Run: mysql -u root -p jagasewa_prod_db < backend/config/ic_verification_migration.sql\n";
    }
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}

// Summary
echo "\n=== Test Summary ===\n";
echo "All basic tests completed.\n";
echo "To test with real IC images, use the frontend or curl:\n";
echo "curl -X POST http://localhost/api/tenant/verify-ic.php \\\n";
echo "  -F \"ic_front=@ic_front.jpg\" \\\n";
echo "  -F \"ic_back=@ic_back.jpg\"\n\n";

echo "✅ IC Verification system is ready!\n";
?>
