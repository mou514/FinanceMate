-- Migration: 018_add_last_active.sql
-- Add last_active_at column to users table for real-time activity tracking

ALTER TABLE users ADD COLUMN last_active_at INTEGER;
