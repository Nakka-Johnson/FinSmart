-- AI Feedback table for storing user corrections and confirmations
-- Used to improve model training and track user overrides

CREATE TYPE ai_feedback_type AS ENUM (
    'CATEGORY_OVERRIDE',
    'MERCHANT_CONFIRM',
    'ANOMALY_LABEL'
);

CREATE TABLE ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    type ai_feedback_type NOT NULL,
    payload JSONB NOT NULL,
    
    -- Optional reference to transaction
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL
);

-- Indexes for common queries
CREATE INDEX idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX idx_ai_feedback_type ON ai_feedback(type);
CREATE INDEX idx_ai_feedback_created_at ON ai_feedback(created_at DESC);
CREATE INDEX idx_ai_feedback_transaction_id ON ai_feedback(transaction_id) WHERE transaction_id IS NOT NULL;

-- GIN index for JSONB queries
CREATE INDEX idx_ai_feedback_payload ON ai_feedback USING GIN (payload);

COMMENT ON TABLE ai_feedback IS 'Stores user feedback for AI predictions (category overrides, merchant confirmations, anomaly labels)';
COMMENT ON COLUMN ai_feedback.payload IS 'JSONB payload with type-specific data: txnId, previous, new, confidence, aiWhy, etc.';
