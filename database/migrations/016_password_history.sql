-- Migration 016: Password History
-- Creates password_history table to prevent reuse of recent passwords.
-- Each row stores one previous password hash for a user.
-- The service checks the last 5 hashes before allowing a password reset.

CREATE TABLE IF NOT EXISTS password_history (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash TEXT       NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Index for fast lookup of recent hashes by user (ordered newest-first)
CREATE INDEX IF NOT EXISTS idx_password_history_user_id
  ON password_history(user_id, created_at DESC);
