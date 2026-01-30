-- Migration: 008_admin_and_logs.sql
-- Add role and is_active to users, and create system_logs table

-- Add role and is_active columns to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;

-- Create system_logs table
CREATE TABLE system_logs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL, -- 'info', 'warn', 'error'
  message TEXT NOT NULL,
  details TEXT, -- JSON string
  timestamp INTEGER NOT NULL
);

-- Index for logs
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX idx_system_logs_level ON system_logs(level);
