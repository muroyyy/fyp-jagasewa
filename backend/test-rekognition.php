<?php
/**
 * Test script for Rekognition integration
 * Usage: php test-rekognition.php <path-to-image>
 */

require_once __DIR__ . '/config/rekognition_helper.php';

if ($argc < 2) {
    echo "Usage: php test-rekognition.php <path-to-image>\n";
    exit(1);
}

$imagePath = $argv[1];

if (!file_exists($imagePath)) {
    echo "Error: Image file not found: $imagePath\n";
    exit(1);
}

echo "Testing Rekognition integration...\n";
echo "Image: $imagePath\n";
echo str_repeat("-", 50) . "\n";

$imageBytes = file_get_contents($imagePath);
$result = analyzeMaintenancePhoto($imageBytes);

if ($result['success']) {
    echo "✅ Analysis successful!\n\n";
    
    echo "📊 DETECTED LABELS:\n";
    foreach ($result['labels'] as $label) {
        echo sprintf("  - %s (%.2f%% confidence)\n", $label['name'], $label['confidence']);
    }
    
    if (!empty($result['moderation'])) {
        echo "\n⚠️  MODERATION LABELS:\n";
        foreach ($result['moderation'] as $label) {
            echo sprintf("  - %s (%.2f%% confidence)\n", $label['name'], $label['confidence']);
        }
    }
    
    echo "\n🤖 AI ANALYSIS:\n";
    $analysis = $result['analysis'];
    echo "  Category: " . $analysis['suggested_category'] . "\n";
    echo "  Priority: " . $analysis['suggested_priority'] . "\n";
    echo "  Severity: " . $analysis['severity'] . "\n";
    echo "  Confidence: " . $analysis['confidence'] . "%\n";
    echo "  Issues: " . implode(', ', $analysis['detected_issues']) . "\n";
    
} else {
    echo "❌ Analysis failed: " . $result['error'] . "\n";
    exit(1);
}

echo "\n" . str_repeat("-", 50) . "\n";
echo "Test completed successfully!\n";
?>
