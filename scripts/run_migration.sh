#!/bin/bash

# Run this script to create the payment_reminders table
# Usage: ./run_migration.sh

echo "Creating payment_reminders table..."

# You can run this SQL directly in your MySQL client:
cat << 'EOF'

-- Create payment_reminders table to track when reminders are sent
CREATE TABLE payment_reminders (
    reminder_id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    property_id INT NOT NULL,
    unit_id INT NULL,
    payment_period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    reminder_type ENUM('overdue', 'upcoming', 'manual') NOT NULL DEFAULT 'manual',
    sent_by INT NOT NULL, -- landlord_id who sent the reminder
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    message TEXT NULL,
    notification_method ENUM('email', 'sms', 'system') DEFAULT 'system',
    
    -- Foreign key constraints
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(property_id) ON DELETE CASCADE,
    FOREIGN KEY (unit_id) REFERENCES property_units(unit_id) ON DELETE SET NULL,
    FOREIGN KEY (sent_by) REFERENCES landlords(landlord_id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_tenant_period (tenant_id, payment_period),
    INDEX idx_sent_at (sent_at),
    INDEX idx_property_period (property_id, payment_period)
);

-- Add fields to payments table to track if reminder was sent (optional)
ALTER TABLE payments 
ADD COLUMN reminder_sent TINYINT(1) DEFAULT 0 AFTER status,
ADD COLUMN last_reminder_sent TIMESTAMP NULL AFTER reminder_sent;

EOF

echo ""
echo "Copy the SQL above and run it in your MySQL client to create the payment_reminders table."
echo "Or run: mysql -u [username] -p [database_name] < /home/amirul/fyp-jagasewa/backend/config/payment_reminders_migration.sql"