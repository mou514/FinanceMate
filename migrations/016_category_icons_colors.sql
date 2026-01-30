-- Migration: 016_category_icons_colors.sql
-- Add icon and color support to categories

ALTER TABLE categories ADD COLUMN icon TEXT;
ALTER TABLE categories ADD COLUMN color TEXT;
