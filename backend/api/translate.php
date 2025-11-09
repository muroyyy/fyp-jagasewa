<?php
require_once '../config/cors.php';
require_once '../config/translate_helper.php';

header('Content-Type: application/json');

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

$translateHelper = new TranslateHelper();
$result = $translateHelper->translateText(
    $input['text'], 
    $input['targetLang'], 
    $input['sourceLang'] ?? 'en'
);

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