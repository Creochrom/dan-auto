-- =============================================================================
-- Migration 001 — leads + bookings tables
-- Dan Auto Centre
-- Run once in the Supabase SQL editor, or via Supabase CLI:
--   supabase db push
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Shared trigger: keeps updated_at current on every row update.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id                  TEXT        PRIMARY KEY,
  status              TEXT        NOT NULL DEFAULT 'new',
  name                TEXT        NOT NULL,
  phone               TEXT        NOT NULL,
  email               TEXT,
  registration        TEXT,
  vehicle_model       TEXT,
  problem_description TEXT,
  preferred_date      TEXT,
  source              TEXT        NOT NULL DEFAULT 'website',
  ai_summary          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT leads_status_check CHECK (
    status IN ('new', 'contacted', 'qualified', 'converted', 'closed')
  ),
  CONSTRAINT leads_source_check CHECK (
    source IN ('website', 'assistant', 'contact_form', 'callback')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at   ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_registration ON leads (registration)
  WHERE registration IS NOT NULL;

-- Auto-update trigger
DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row-Level Security — service role bypasses RLS; anon/authenticated blocked.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id               TEXT        PRIMARY KEY,
  status           TEXT        NOT NULL DEFAULT 'new',
  service          TEXT        NOT NULL,
  registration     TEXT        NOT NULL,
  vehicle_model    TEXT,
  preferred_date   TEXT        NOT NULL,
  preferred_time   TEXT        NOT NULL,
  duration         TEXT        NOT NULL DEFAULT '1h',
  customer_name    TEXT        NOT NULL,
  customer_phone   TEXT        NOT NULL,
  customer_email   TEXT,
  notes            TEXT,
  source           TEXT        NOT NULL DEFAULT 'website',
  intake_summary   JSONB,
  upload_ids       TEXT[],
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT bookings_status_check CHECK (
    status IN ('new', 'awaiting_callback', 'confirmed', 'in_progress', 'completed')
  ),
  CONSTRAINT bookings_source_check CHECK (
    source IN ('website', 'assistant', 'admin', 'phone')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at   ON bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_registration ON bookings (registration);

-- Auto-update trigger
DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row-Level Security — service role bypasses RLS; anon/authenticated blocked.
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
