-- Create table for logging AI processing events
CREATE TABLE IF NOT EXISTS ai_processing_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,         -- 'gemini', 'openai', etc.
    model TEXT,                     -- 'gemini-1.5-flash', etc.
    duration_ms INTEGER NOT NULL,   -- Processing time in ms
    success INTEGER NOT NULL,       -- 1 for success, 0 for failure
    error TEXT,                     -- Error message if failed
    timestamp INTEGER NOT NULL,     -- Date.now()
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_logs_timestamp ON ai_processing_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_logs_provider ON ai_processing_logs(provider);
