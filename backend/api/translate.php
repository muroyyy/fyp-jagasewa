<?php
// Enable error reporting for debugging
ini_set('display_errors', 0);
ini_set('log_errors', 1);

require_once '../config/cors.php';

// Set CORS headers first
setCorsHeaders();

try {
    require_once '../vendor/autoload.php';
    require_once '../config/translate_helper.php';
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Server configuration error: ' . $e->getMessage()
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['text']) || !isset($input['targetLang'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

try {
    $translateHelper = new TranslateHelper();
    $result = $translateHelper->translateText(
        $input['text'], 
        $input['targetLang'], 
        $input['sourceLang'] ?? 'en'
    );
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Translation service error: ' . $e->getMessage()
    ]);
    exit;
}

if ($result['success']) {
    echo json_encode([
        'success' => true,
        'translatedText' => $result['translatedText']
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $result['error']
    ]);
}
?>