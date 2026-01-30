-- Create api_auth_keys table
CREATE TABLE IF NOT EXISTS api_auth_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  prefix TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_used_at INTEGER,
  expires_at INTEGER
);

-- Index for faster lookups by hash
CREATE INDEX IF NOT EXISTS idx_api_auth_keys_hash ON api_auth_keys(key_hash);

-- Index for listing keys by user
CREATE INDEX IF NOT EXISTS idx_api_auth_keys_user ON api_auth_keys(user_id);
