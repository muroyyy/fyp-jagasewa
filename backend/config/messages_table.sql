-- Messages table for real-time chat between landlords and tenants
CREATE TABLE messages (
    message_id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('text', 'image', 'document', 'system_maintenance', 'system_payment') DEFAULT 'text',
    reference_id INT NULL, -- Links to maintenance_requests.request_id or payments.payment_id
    reference_type ENUM('maintenance_request', 'payment') NULL,
    attachment_path VARCHAR(255) NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    
    INDEX idx_conversation (property_id, sender_id, receiver_id, created_at),
    INDEX idx_unread (receiver_id, is_read),
    INDEX idx_reference (reference_type, reference_id)
);

-- Add triggers to auto-create messages for maintenance requests
DELIMITER //
CREATE TRIGGER after_maintenance_request_insert
AFTER INSERT ON maintenance_requests
FOR EACH ROW
BEGIN
    DECLARE landlord_user_id INT;
    
    -- Get landlord's user_id from property
    SELECT l.user_id INTO landlord_user_id
    FROM properties p
    JOIN landlords l ON p.landlord_id = l.landlord_id
    WHERE p.property_id = NEW.property_id;
    
    -- Get tenant's user_id
    SET @tenant_user_id = (SELECT user_id FROM tenants WHERE tenant_id = NEW.tenant_id);
    
    -- Insert system message
    INSERT INTO messages (
        property_id, sender_id, receiver_id, message, message_type, 
        reference_id, reference_type
    ) VALUES (
        NEW.property_id, @tenant_user_id, landlord_user_id,
        CONCAT('🔧 New maintenance request: ', NEW.title),
        'system_maintenance', NEW.request_id, 'maintenance_request'
    );
END//

-- Add trigger for payment notifications
CREATE TRIGGER after_payment_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    DECLARE landlord_user_id INT;
    
    -- Get landlord's user_id from property
    SELECT l.user_id INTO landlord_user_id
    FROM properties p
    JOIN landlords l ON p.landlord_id = l.landlord_id
    WHERE p.property_id = NEW.property_id;
    
    -- Get tenant's user_id
    SET @tenant_user_id = (SELECT user_id FROM tenants WHERE tenant_id = NEW.tenant_id);
    
    -- Insert system message
    INSERT INTO messages (
        property_id, sender_id, receiver_id, message, message_type,
        reference_id, reference_type
    ) VALUES (
        NEW.property_id, @tenant_user_id, landlord_user_id,
        CONCAT('💰 Payment received: RM', NEW.amount, ' - ', NEW.payment_method),
        'system_payment', NEW.payment_id, 'payment'
    );
END//
DELIMITER ;