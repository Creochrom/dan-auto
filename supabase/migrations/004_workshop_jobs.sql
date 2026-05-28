-- =============================================================================
-- Migration 004 — Workshop OS v1: jobs, job_notes, job_status_events
-- Dan Auto Centre
-- Run once in the Supabase SQL editor or via: supabase db push
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- =============================================================================
-- update_updated_at() trigger function is already defined in migration 001.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- jobs — one row per workshop job card
-- ---------------------------------------------------------------------------
-- A job is created when:
--   a) A booking is confirmed (booking_id FK set)         — scheduled path
--   b) A walk-in arrives without a prior booking           — ad-hoc path
-- Default state "booked" (scheduled) or "checked_in" (walk-in).
-- scheduled_date is the day the vehicle is expected / arrived.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id             TEXT        PRIMARY KEY,
  booking_id     TEXT        REFERENCES bookings(id) ON DELETE SET NULL,
  registration   TEXT        NOT NULL,
  scheduled_date DATE        NOT NULL DEFAULT CURRENT_DATE,
  status         TEXT        NOT NULL DEFAULT 'booked',
  customer_name  TEXT        NOT NULL,
  customer_phone TEXT        NOT NULL,
  service        TEXT        NOT NULL,
  symptoms_text  TEXT,
  notes_text     TEXT,
  assigned_to    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT jobs_status_check CHECK (
    status IN (
      'booked', 'checked_in', 'diagnosing', 'awaiting_approval',
      'awaiting_parts', 'in_progress', 'quality_check',
      'ready_for_collection', 'collected', 'cancelled'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_jobs_status         ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON jobs (scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_registration   ON jobs (registration);
CREATE INDEX IF NOT EXISTS idx_jobs_booking_id     ON jobs (booking_id)
  WHERE booking_id IS NOT NULL;

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- job_notes — append-only log; never deleted, never edited
-- source: "human" (technician) | "ai" (copilot-generated suggestion)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_notes (
  id         TEXT        PRIMARY KEY,
  job_id     TEXT        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  author     TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  source     TEXT        NOT NULL DEFAULT 'human',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT job_notes_source_check CHECK (source IN ('human', 'ai'))
);

CREATE INDEX IF NOT EXISTS idx_job_notes_job_id    ON job_notes (job_id);
CREATE INDEX IF NOT EXISTS idx_job_notes_created_at ON job_notes (created_at DESC);

ALTER TABLE job_notes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- job_status_events — minimal audit trail (one row per status transition)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_status_events (
  id          TEXT        PRIMARY KEY,
  job_id      TEXT        NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status   TEXT        NOT NULL,
  changed_by  TEXT        NOT NULL DEFAULT 'system',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_job_status_events_job_id ON job_status_events (job_id);

ALTER TABLE job_status_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- RLS policies — service role bypasses RLS; anon/authenticated blocked.
-- (Same pattern as leads/bookings: no public access to workshop data.)
-- ---------------------------------------------------------------------------
