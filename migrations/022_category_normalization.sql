-- Migration: 022_category_normalization.sql
-- Link expenses to categories table for normalization

-- 1. Add category_id column to expenses
ALTER TABLE expenses ADD COLUMN category_id TEXT REFERENCES categories(id);

-- 2. Populate categories table with any missing categories from expenses
-- (We use a temporary ID generation trick: user_id || '_' || category_name or random hex)
-- Since SQLite standard doesn't have uuid(), we might need application level migration or use hex(randomblob(16))
-- We'll try to insert distinct categories that don't satisfy the unique constraint yet.
-- Assumes categories table has UNIQUE(user_id, name) from 015_custom_categories.sql

INSERT OR IGNORE INTO categories (id, user_id, name, created_at)
SELECT 
    hex(randomblob(16)), 
    user_id, 
    category, 
    strftime('%s','now') * 1000
FROM expenses
GROUP BY user_id, category;

-- 3. Update expenses.category_id by matching name
-- We use a correlated subquery since SQLite support for UPDATE JOIN varies by version (but usually supported in recent)
UPDATE expenses
SET category_id = (
    SELECT id 
    FROM categories c 
    WHERE c.name = expenses.category 
    AND c.user_id = expenses.user_id
);

-- 4. Create index on category_id
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);

-- Note: We generally do NOT drop the 'category' text column immediately to prevent downtime/code breakage.
-- The application should switch to reading category name from the JOIN or continue using the text column 
-- but write to both (or rely on category_id).
-- Eventually, we can drop the text column in a future migration.
