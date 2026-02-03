-- Migration: 024_add_user_details.sql
-- Description: Add first_name, last_name, and birthdate to users table

ALTER TABLE users ADD COLUMN first_name TEXT;
ALTER TABLE users ADD COLUMN last_name TEXT;
ALTER TABLE users ADD COLUMN birthdate TEXT;
