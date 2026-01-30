-- Migration: 023_budget_alert_threshold.sql
ALTER TABLE budgets ADD COLUMN alert_threshold REAL DEFAULT 80;
