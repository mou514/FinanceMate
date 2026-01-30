-- Migration: 019_expenses_fts.sql
-- Enable Full-Text Search for expenses using SQLite FTS5

-- Create separate FTS table since main table has TEXT PK
CREATE VIRTUAL TABLE IF NOT EXISTS expenses_fts USING fts5(
    id UNINDEXED, 
    merchant, 
    category
);

-- Triggers to keep FTS index in sync with expenses table

-- On Insert
CREATE TRIGGER IF NOT EXISTS trg_expenses_fts_insert AFTER INSERT ON expenses BEGIN
    INSERT INTO expenses_fts(id, merchant, category) 
    VALUES (new.id, new.merchant, new.category);
END;

-- On Delete
CREATE TRIGGER IF NOT EXISTS trg_expenses_fts_delete AFTER DELETE ON expenses BEGIN
    DELETE FROM expenses_fts WHERE id = old.id;
END;

-- On Update
CREATE TRIGGER IF NOT EXISTS trg_expenses_fts_update AFTER UPDATE ON expenses BEGIN
    DELETE FROM expenses_fts WHERE id = old.id;
    INSERT INTO expenses_fts(id, merchant, category) 
    VALUES (new.id, new.merchant, new.category);
END;

-- Populate existing data (safe to run multiple times as it only inserts active records, 
-- but might duplicate if we don't clear. For migration, we assume fresh or one-off runs)
-- To be safe, we clear and re-populate
DELETE FROM expenses_fts;
INSERT INTO expenses_fts(id, merchant, category) SELECT id, merchant, category FROM expenses;
