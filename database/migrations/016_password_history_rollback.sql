-- Rollback Migration 016: Password History
-- Drops the password_history table and its indexes.

DROP TABLE IF EXISTS password_history;
