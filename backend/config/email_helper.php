<?php
/**
 * Email Helper using AWS SES or PHP mail()
 * For FYP: Falls back to returning link if email fails
 */

function sendTenantInvitation($recipientEmail, $landlordName, $propertyName, $invitationToken) {
    $invitationLink = "https://jagasewa.cloud/tenant-invitation?token=" . $invitationToken;
    
    $subject = "Invitation to Join JagaSewa - Complete Your Tenant Registration";
    $message = "
    <html>
    <body style='font-family: Arial, sans-serif;'>
        <h2>You've Been Invited to JagaSewa</h2>
        <p>Hello,</p>
        <p><strong>{$landlordName}</strong> has assigned you as a tenant for <strong>{$propertyName}</strong>.</p>
        <p>Click the link below to complete your registration:</p>
        <p><a href='{$invitationLink}' style='background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;'>Complete Registration</a></p>
        <p>Or copy this link: {$invitationLink}</p>
        <p>This invitation expires in 7 days.</p>
        <p>Best regards,<br>JagaSewa Team</p>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: JagaSewa <noreply@jagasewa.cloud>" . "\r\n";
    
    // Try to send email
    $emailSent = @mail($recipientEmail, $subject, $message, $headers);
    
    return [
        'email_sent' => $emailSent,
        'invitation_link' => $invitationLink
    ];
}
?>
