-- Add metadata field to messages table for storing animated video URLs and other metadata
ALTER TABLE messages ADD COLUMN metadata JSONB;

-- Create index for faster metadata queries
CREATE INDEX idx_messages_metadata ON messages USING GIN (metadata) WHERE metadata IS NOT NULL;

-- Add comment
COMMENT ON COLUMN messages.metadata IS 'JSON metadata including animatedVideoUrl and other message-specific data';
