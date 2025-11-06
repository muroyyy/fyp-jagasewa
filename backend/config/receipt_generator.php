<?php
/**
 * Receipt Generator for Payment Receipts
 */

require_once 'database.php';
require_once 's3_helper.php';

function generatePaymentReceipt($paymentId) {
    try {
        $database = new Database();
        $conn = $database->getConnection();
        
        // Get payment details with tenant and property info
        $stmt = $conn->prepare("
            SELECT 
                p.payment_id,
                p.amount,
                p.payment_method,
                p.payment_provider,
                p.transaction_id,
                p.payment_date,
                t.full_name as tenant_name,
                t.ic_number,
                t.phone,
                u.email,
                pr.property_name,
                pr.address,
                l.full_name as landlord_name
            FROM payments p
            JOIN tenants t ON p.tenant_id = t.tenant_id
            JOIN users u ON t.user_id = u.user_id
            JOIN properties pr ON p.property_id = pr.property_id
            JOIN landlords l ON pr.landlord_id = l.landlord_id
            WHERE p.payment_id = :payment_id
        ");
        $stmt->bindParam(':payment_id', $paymentId);
        $stmt->execute();
        
        $payment = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$payment) {
            return false;
        }
        
        // Generate HTML receipt
        $html = generateReceiptHTML($payment);
        
        // Save as temporary HTML file
        $tempFile = sys_get_temp_dir() . '/receipt_' . $paymentId . '_' . time() . '.html';
        file_put_contents($tempFile, $html);
        
        // Upload to S3
        $s3Key = 'payments/receipt_' . $paymentId . '_' . time() . '.html';
        $s3Url = uploadToS3($tempFile, $s3Key, 'text/html');
        
        // Clean up temp file
        unlink($tempFile);
        
        if ($s3Url) {
            // Update payment record with receipt URL
            $updateStmt = $conn->prepare("UPDATE payments SET receipt_url = :receipt_url WHERE payment_id = :payment_id");
            $updateStmt->bindParam(':receipt_url', $s3Url);
            $updateStmt->bindParam(':payment_id', $paymentId);
            $updateStmt->execute();
            
            return $s3Url;
        }
        
        return false;
        
    } catch (Exception $e) {
        error_log("Receipt generation error: " . $e->getMessage());
        return false;
    }
}

function generateReceiptHTML($payment) {
    $receiptDate = date('d/m/Y H:i:s', strtotime($payment['payment_date']));
    $amount = number_format($payment['amount'], 2);
    
    return "
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset='UTF-8'>
        <title>Payment Receipt - {$payment['transaction_id']}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .receipt { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: bold; color: #10b981; margin-bottom: 5px; }
            .subtitle { color: #6b7280; font-size: 14px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 16px; font-weight: bold; color: #374151; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .label { color: #6b7280; }
            .value { font-weight: 500; color: #111827; }
            .amount-section { background: #f0fdf4; padding: 20px; border-radius: 8px; text-align: center; }
            .amount { font-size: 32px; font-weight: bold; color: #10b981; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
            @media print { body { background: white; } .receipt { box-shadow: none; } }
        </style>
    </head>
    <body>
        <div class='receipt'>
            <div class='header'>
                <div class='logo'>JagaSewa</div>
                <div class='subtitle'>Rental Management System</div>
                <div style='margin-top: 15px; font-size: 18px; font-weight: bold; color: #374151;'>PAYMENT RECEIPT</div>
            </div>
            
            <div class='section'>
                <div class='section-title'>Transaction Details</div>
                <div class='info-row'>
                    <span class='label'>Transaction ID:</span>
                    <span class='value'>{$payment['transaction_id']}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Payment Date:</span>
                    <span class='value'>{$receiptDate}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Payment Method:</span>
                    <span class='value'>{$payment['payment_provider']}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Status:</span>
                    <span class='value' style='color: #10b981;'>Completed</span>
                </div>
            </div>
            
            <div class='section'>
                <div class='section-title'>Tenant Information</div>
                <div class='info-row'>
                    <span class='label'>Name:</span>
                    <span class='value'>{$payment['tenant_name']}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Email:</span>
                    <span class='value'>{$payment['email']}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Phone:</span>
                    <span class='value'>{$payment['phone']}</span>
                </div>
            </div>
            
            <div class='section'>
                <div class='section-title'>Property Information</div>
                <div class='info-row'>
                    <span class='label'>Property:</span>
                    <span class='value'>{$payment['property_name']}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Address:</span>
                    <span class='value'>{$payment['address']}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Landlord:</span>
                    <span class='value'>{$payment['landlord_name']}</span>
                </div>
            </div>
            
            <div class='amount-section'>
                <div style='color: #6b7280; margin-bottom: 5px;'>Amount Paid</div>
                <div class='amount'>RM {$amount}</div>
            </div>
            
            <div class='footer'>
                <p>This is a computer-generated receipt. No signature required.</p>
                <p>Generated on " . date('d/m/Y H:i:s') . " | JagaSewa Rental Management System</p>
            </div>
        </div>
    </body>
    </html>";
}
?>