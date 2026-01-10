-- Add AI summary fields to sessions table
ALTER TABLE sessions ADD COLUMN summary TEXT;
ALTER TABLE sessions ADD COLUMN summary_generated_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster summary lookups
CREATE INDEX idx_sessions_summary_generated ON sessions(summary_generated_at) WHERE summary IS NOT NULL;
