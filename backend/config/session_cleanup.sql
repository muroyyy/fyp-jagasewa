-- Add columns for enhanced session management
ALTER TABLE sessions 
ADD COLUMN refresh_token VARCHAR(64) NULL UNIQUE,
ADD COLUMN last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for performance (user_id and expires_at already have indexes)
CREATE INDEX idx_sessions_refresh_token ON sessions(refresh_token);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);

-- Clean up expired sessions (run this periodically)
DELETE FROM sessions WHERE expires_at <= NOW();

-- Update existing sessions to have last_activity
UPDATE sessions SET last_activity = created_at WHERE last_activity IS NULL;