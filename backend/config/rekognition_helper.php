<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Aws\Rekognition\RekognitionClient;
use Aws\Exception\AwsException;

function analyzeMaintenancePhoto($imageBytes, $description = '') {
    try {
        $client = new RekognitionClient([
            'region' => 'ap-southeast-1',
            'version' => 'latest'
        ]);

        // Detect labels (objects, damage types)
        $labelsResult = $client->detectLabels([
            'Image' => ['Bytes' => $imageBytes],
            'MaxLabels' => 20,
            'MinConfidence' => 70
        ]);

        // Detect moderation labels (severity indicators)
        $moderationResult = $client->detectModerationLabels([
            'Image' => ['Bytes' => $imageBytes],
            'MinConfidence' => 60
        ]);

        $labels = [];
        foreach ($labelsResult['Labels'] as $label) {
            $labels[] = [
                'name' => $label['Name'],
                'confidence' => round($label['Confidence'], 2)
            ];
        }

        $moderationLabels = [];
        foreach ($moderationResult['ModerationLabels'] as $label) {
            $moderationLabels[] = [
                'name' => $label['Name'],
                'confidence' => round($label['Confidence'], 2)
            ];
        }

        // Analyze and categorize with description context
        $analysis = categorizeMaintenanceIssue($labels, $moderationLabels, $description);

        return [
            'success' => true,
            'labels' => $labels,
            'moderation' => $moderationLabels,
            'analysis' => $analysis
        ];

    } catch (AwsException $e) {
        error_log("Rekognition error: " . $e->getMessage());
        return [
            'success' => false,
            'error' => 'AI analysis failed'
        ];
    }
}

function categorizeMaintenanceIssue($labels, $moderationLabels, $description = '') {
    $labelNames = array_map(fn($l) => strtolower($l['name']), $labels);
    $descLower = strtolower($description);
    
    // Category detection
    $category = 'other';
    $categoryKeywords = [
        'plumbing' => ['water', 'pipe', 'leak', 'faucet', 'sink', 'toilet', 'drain', 'plumbing'],
        'electrical' => ['wire', 'outlet', 'switch', 'light', 'electrical', 'cable', 'socket'],
        'appliances' => ['refrigerator', 'oven', 'stove', 'dishwasher', 'washer', 'dryer', 'appliance'],
        'hvac' => ['air conditioner', 'heater', 'vent', 'hvac', 'thermostat'],
        'carpentry' => ['door', 'window', 'cabinet', 'furniture', 'wood', 'floor'],
        'painting' => ['wall', 'paint', 'ceiling', 'crack'],
        'pest_control' => ['insect', 'pest', 'rodent', 'bug'],
        'cleaning' => ['dirt', 'stain', 'mold', 'dust']
    ];

    // Check description first for better context
    foreach ($categoryKeywords as $cat => $keywords) {
        foreach ($keywords as $keyword) {
            if (strpos($descLower, $keyword) !== false) {
                $category = $cat;
                break 2;
            }
        }
    }
    
    // If no match in description, check image labels
    if ($category === 'other') {
        foreach ($categoryKeywords as $cat => $keywords) {
            foreach ($keywords as $keyword) {
                if (in_array($keyword, $labelNames)) {
                    $category = $cat;
                    break 2;
                }
            }
        }
    }

    // Severity detection with description context
    $severity = 'low';
    $damageKeywords = ['broken', 'damaged', 'crack', 'leak', 'rust', 'mold', 'fire', 'burst', 'flooding'];
    $urgentKeywords = ['urgent', 'emergency', 'flood', 'fire', 'electrical hazard', 'gas', 'dangerous', 'severe'];
    
    // Check description for urgency keywords
    foreach ($urgentKeywords as $keyword) {
        if (strpos($descLower, $keyword) !== false) {
            $severity = 'urgent';
            break;
        }
    }
    
    // Check labels if not urgent
    if ($severity !== 'urgent') {
        $damageCount = 0;
        foreach ($labelNames as $label) {
            foreach ($damageKeywords as $keyword) {
                if (strpos($label, $keyword) !== false) {
                    $damageCount++;
                }
            }
            foreach ($urgentKeywords as $keyword) {
                if (strpos($label, $keyword) !== false) {
                    $severity = 'urgent';
                    break 2;
                }
            }
        }
        
        // Check description for damage keywords
        foreach ($damageKeywords as $keyword) {
            if (strpos($descLower, $keyword) !== false) {
                $damageCount++;
            }
        }
    }

    if ($severity !== 'urgent') {
        if ($damageCount >= 3 || count($moderationLabels) > 0) {
            $severity = 'high';
        } elseif ($damageCount >= 1) {
            $severity = 'medium';
        }
    }

    // Priority mapping
    $priorityMap = ['low' => 'low', 'medium' => 'medium', 'high' => 'high', 'urgent' => 'urgent'];
    $priority = $priorityMap[$severity];

    return [
        'suggested_category' => $category,
        'suggested_priority' => $priority,
        'severity' => $severity,
        'detected_issues' => array_slice($labelNames, 0, 5),
        'confidence' => count($labels) > 0 ? round(array_sum(array_column($labels, 'confidence')) / count($labels), 2) : 0,
        'context_used' => !empty($description)
    ];
}
?>
