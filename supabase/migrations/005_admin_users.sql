-- =============================================================================
-- Migration 005 — admin users + roles
-- Dan Auto Centre
-- Safe to re-run: IF NOT EXISTS guards and trigger replacement.
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id                      TEXT        PRIMARY KEY,
  login                   TEXT        NOT NULL UNIQUE,
  display_name            TEXT        NOT NULL,
  role                    TEXT        NOT NULL DEFAULT 'mechanic',
  password_hash           TEXT        NOT NULL,
  active                  BOOLEAN     NOT NULL DEFAULT true,
  last_password_change_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT admin_users_role_check CHECK (
    role IN ('owner', 'admin', 'mechanic')
  )
);

CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users (role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users (active);

DROP TRIGGER IF EXISTS admin_users_updated_at ON admin_users;
CREATE TRIGGER admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

