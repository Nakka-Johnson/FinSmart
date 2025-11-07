-- Create audit_events table for tracking API requests
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255),
    method VARCHAR(10) NOT NULL,
    path VARCHAR(512) NOT NULL,
    status INTEGER,
    ip VARCHAR(45),
    user_agent VARCHAR(512),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for querying by user
CREATE INDEX idx_audit_events_user_email ON audit_events(user_email);

-- Create index for querying by timestamp
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);
