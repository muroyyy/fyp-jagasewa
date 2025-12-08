<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Aws\Rekognition\RekognitionClient;
use Aws\Exception\AwsException;

function extractICData($imageBytes) {
    try {
        $client = new RekognitionClient([
            'region' => 'ap-southeast-1',
            'version' => 'latest'
        ]);

        $result = $client->detectText([
            'Image' => ['Bytes' => $imageBytes]
        ]);

        $extractedText = [];
        foreach ($result['TextDetections'] as $detection) {
            if ($detection['Type'] === 'LINE') {
                $extractedText[] = $detection['DetectedText'];
            }
        }

        return [
            'success' => true,
            'text_lines' => $extractedText,
            'full_text' => implode("\n", $extractedText)
        ];

    } catch (AwsException $e) {
        error_log("Rekognition error: " . $e->getMessage());
        return [
            'success' => false,
            'error' => 'Text extraction failed'
        ];
    }
}

function parseICNumber($textLines) {
    foreach ($textLines as $line) {
        if (preg_match('/(\d{6})-?(\d{2})-?(\d{4})/', $line, $matches)) {
            return $matches[1] . '-' . $matches[2] . '-' . $matches[3];
        }
    }
    return null;
}

function parseName($textLines) {
    // Malaysian IC names are in CAPS
    foreach ($textLines as $line) {
        if (preg_match('/^[A-Z\s]{3,}$/', trim($line)) && strlen(trim($line)) > 5) {
            $name = trim($line);
            // Skip common IC keywords
            $skipWords = ['MALAYSIA', 'MYKAD', 'WARGANEGARA', 'IDENTITY', 'CARD', 'ALAMAT', 'ADDRESS'];
            if (!in_array($name, $skipWords)) {
                return $name;
            }
        }
    }
    return null;
}

function parseDateOfBirth($icNumber) {
    if (!$icNumber) return null;
    
    $parts = explode('-', $icNumber);
    if (count($parts) !== 3) return null;
    
    $yymmdd = $parts[0];
    $yy = substr($yymmdd, 0, 2);
    $mm = substr($yymmdd, 2, 2);
    $dd = substr($yymmdd, 4, 2);
    
    // Determine century: 00-25 = 2000s, 26-99 = 1900s
    $year = (intval($yy) <= 25) ? '20' . $yy : '19' . $yy;
    
    return $year . '-' . $mm . '-' . $dd;
}

function parseGender($icNumber) {
    if (!$icNumber) return null;
    
    $parts = explode('-', $icNumber);
    if (count($parts) !== 3) return null;
    
    $lastDigit = intval(substr($parts[2], -1));
    return ($lastDigit % 2 === 1) ? 'Male' : 'Female';
}

function parseAddress($textLines) {
    $addressStarted = false;
    $addressLines = [];
    
    foreach ($textLines as $line) {
        $upperLine = strtoupper(trim($line));
        
        if (strpos($upperLine, 'ALAMAT') !== false || strpos($upperLine, 'ADDRESS') !== false) {
            $addressStarted = true;
            continue;
        }
        
        if ($addressStarted) {
            // Stop at certain keywords
            if (preg_match('/TARIKH|DATE|JANTINA|SEX|WARGANEGARA/', $upperLine)) {
                break;
            }
            
            // Add non-empty lines
            if (!empty(trim($line)) && strlen(trim($line)) > 2) {
                $addressLines[] = trim($line);
            }
            
            // Limit to 4 lines
            if (count($addressLines) >= 4) {
                break;
            }
        }
    }
    
    return !empty($addressLines) ? implode(', ', $addressLines) : null;
}

function analyzeICData($frontTextLines, $backTextLines = []) {
    $allLines = array_merge($frontTextLines, $backTextLines);
    
    $icNumber = parseICNumber($allLines);
    $name = parseName($frontTextLines);
    $dob = parseDateOfBirth($icNumber);
    $gender = parseGender($icNumber);
    $address = parseAddress($backTextLines ?: $frontTextLines);
    
    // Calculate confidence based on extracted fields
    $fieldsFound = 0;
    $totalFields = 5;
    
    if ($icNumber) $fieldsFound++;
    if ($name) $fieldsFound++;
    if ($dob) $fieldsFound++;
    if ($gender) $fieldsFound++;
    if ($address) $fieldsFound++;
    
    $confidence = round(($fieldsFound / $totalFields) * 100, 2);
    
    return [
        'ic_number' => $icNumber,
        'name' => $name,
        'date_of_birth' => $dob,
        'gender' => $gender,
        'address' => $address,
        'confidence' => $confidence,
        'fields_extracted' => $fieldsFound,
        'total_fields' => $totalFields
    ];
}
?>
