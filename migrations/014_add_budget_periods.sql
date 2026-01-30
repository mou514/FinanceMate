-- Migration: 014_add_budget_periods.sql
-- Add period, year, and month columns to budgets table

ALTER TABLE budgets ADD COLUMN period TEXT DEFAULT 'monthly';
ALTER TABLE budgets ADD COLUMN year INTEGER DEFAULT 0;
ALTER TABLE budgets ADD COLUMN month INTEGER DEFAULT 0;
