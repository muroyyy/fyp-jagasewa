<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once 'secrets.php';

use Aws\Translate\TranslateClient;

class TranslateHelper {
    private $translateClient;
    
    public function __construct() {
        $this->translateClient = new TranslateClient([
            'region' => 'ap-southeast-1',
            'version' => 'latest',
            'credentials' => [
                'key' => AWS_ACCESS_KEY_ID,
                'secret' => AWS_SECRET_ACCESS_KEY
            ]
        ]);
    }
    
    public function translateText($text, $targetLanguage, $sourceLanguage = 'en') {
        try {
            $result = $this->translateClient->translateText([
                'Text' => $text,
                'SourceLanguageCode' => $sourceLanguage,
                'TargetLanguageCode' => $targetLanguage
            ]);
            
            return [
                'success' => true,
                'translatedText' => $result['TranslatedText']
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
?>