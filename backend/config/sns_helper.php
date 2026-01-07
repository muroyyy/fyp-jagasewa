<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Aws\Sns\SnsClient;
use Aws\Exception\AwsException;

class SNSHelper {
    private $snsClient;
    private $topicArn;
    
    public function __construct() {
        $this->snsClient = new SnsClient([
            'version' => 'latest',
            'region'  => 'ap-southeast-1'
        ]);
        
        // Get topic ARN from environment, Parameter Store, or construct it
        $this->topicArn = $this->getTopicArn();
    }
    
    private function getTopicArn() {
        // Try environment variable first
        $topicArn = getenv('SNS_PAYMENT_REMINDERS_TOPIC_ARN');
        if ($topicArn) {
            return $topicArn;
        }
        
        // Try AWS Systems Manager Parameter Store
        try {
            $ssmClient = new \Aws\Ssm\SsmClient([
                'version' => 'latest',
                'region'  => 'ap-southeast-1'
            ]);
            
            $result = $ssmClient->getParameter([
                'Name' => '/jagasewa/sns/payment-reminders-topic-arn'
            ]);
            
            return $result['Parameter']['Value'];
        } catch (Exception $e) {
            // Fallback: construct ARN manually
            $accountId = getenv('AWS_ACCOUNT_ID');
            return "arn:aws:sns:ap-southeast-1:{$accountId}:jagasewa-payment-reminders-prod";
        }
    }
    
    public function sendPaymentReminderEmail($data) {
        try {
            $subject = "Payment Reminder - {$data['property_name']}";
            $message = $this->formatEmailMessage($data);
            
            $result = $this->snsClient->publish([
                'TopicArn' => $this->topicArn,
                'Message' => json_encode([
                    'default' => $message,
                    'email' => $this->formatHtmlEmail($data)
                ]),
                'Subject' => $subject,
                'MessageStructure' => 'json',
                'MessageAttributes' => [
                    'tenant_email' => [
                        'DataType' => 'String',
                        'StringValue' => $data['tenant_email']
                    ],
                    'reminder_type' => [
                        'DataType' => 'String', 
                        'StringValue' => $data['reminder_type']
                    ]
                ]
            ]);
            
            return [
                'success' => true,
                'message_id' => $result['MessageId']
            ];
            
        } catch (AwsException $e) {
            error_log("SNS Error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    private function formatEmailMessage($data) {
        $status = $data['reminder_type'] === 'overdue' ? 'overdue' : 'due soon';
        
        return "Dear {$data['tenant_name']},\n\n" .
               "This is a reminder that your rent payment for {$data['property_name']}" .
               ($data['unit_number'] ? " Unit {$data['unit_number']}" : "") .
               " for {$data['payment_period']} is {$status}.\n\n" .
               "Amount: RM " . number_format($data['amount'], 2) . "\n\n" .
               "Please make your payment as soon as possible.\n\n" .
               "Best regards,\n" .
               "JagaSewa Property Management";
    }
    
    private function formatHtmlEmail($data) {
        $status = $data['reminder_type'] === 'overdue' ? 'overdue' : 'due soon';
        $statusColor = $data['reminder_type'] === 'overdue' ? '#dc2626' : '#f59e0b';
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='utf-8'>
            <title>Payment Reminder</title>
        </head>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                <div style='background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;'>
                    <h2 style='color: #1f2937; margin: 0;'>Payment Reminder</h2>
                </div>
                
                <p>Dear <strong>{$data['tenant_name']}</strong>,</p>
                
                <p>This is a reminder that your rent payment is <span style='color: {$statusColor}; font-weight: bold;'>{$status}</span>.</p>
                
                <div style='background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;'>
                    <h3 style='margin: 0 0 10px 0; color: #374151;'>Payment Details</h3>
                    <p style='margin: 5px 0;'><strong>Property:</strong> {$data['property_name']}" . 
                    ($data['unit_number'] ? " Unit {$data['unit_number']}" : "") . "</p>
                    <p style='margin: 5px 0;'><strong>Period:</strong> {$data['payment_period']}</p>
                    <p style='margin: 5px 0;'><strong>Amount:</strong> RM " . number_format($data['amount'], 2) . "</p>
                </div>
                
                <p>Please make your payment as soon as possible to avoid any late fees.</p>
                
                <div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;'>
                    <p style='margin: 0; color: #6b7280; font-size: 14px;'>
                        Best regards,<br>
                        <strong>JagaSewa Property Management</strong>
                    </p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    public function subscribeEmail($email) {
        try {
            $result = $this->snsClient->subscribe([
                'TopicArn' => $this->topicArn,
                'Protocol' => 'email',
                'Endpoint' => $email
            ]);
            
            return [
                'success' => true,
                'subscription_arn' => $result['SubscriptionArn']
            ];
            
        } catch (AwsException $e) {
            error_log("SNS Subscribe Error: " . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}
?>