-- =============================================================================
-- Migration 006 — Job-centric schema (DDL only)
-- Dan Auto Centre
-- Safe to re-run: IF NOT EXISTS / OR REPLACE / guarded ALTER statements.
-- Backfill data: see 007_job_centric_backfill.sql
-- =============================================================================

-- Shared function from migration 001.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Canonical registration helper (uppercase, no spaces/non-alnum).
CREATE OR REPLACE FUNCTION normalize_registration(input_reg TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN upper(regexp_replace(coalesce(input_reg, ''), '[^A-Za-z0-9]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id                    TEXT        PRIMARY KEY,
  registration          TEXT        NOT NULL,
  registration_canonical TEXT       NOT NULL UNIQUE,
  make                  TEXT,
  model                 TEXT,
  year                  INTEGER,
  colour                TEXT,
  vin                   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles (registration);

DROP TRIGGER IF EXISTS vehicles_updated_at ON vehicles;
CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  phone      TEXT        NOT NULL,
  email      TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email) WHERE email IS NOT NULL;

DROP TRIGGER IF EXISTS customers_updated_at ON customers;
CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Extend bookings to link canonical vehicle/customer entities.
-- Keep existing booking shape operational.
-- ---------------------------------------------------------------------------
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_vehicle_id_fkey'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_vehicle_id_fkey
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_customer_id_fkey'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings (vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings (customer_id) WHERE customer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Extend jobs so job card centers on canonical vehicle/customer references.
-- Keep legacy denormalized fields for read compatibility in v1.
-- ---------------------------------------------------------------------------
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS vehicle_id TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS customer_id TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_vehicle_id_fkey'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_vehicle_id_fkey
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'jobs_customer_id_fkey'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_customer_id_fkey
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_vehicle_id ON jobs (vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs (customer_id) WHERE customer_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- job_timeline_events (append-only event stream for jobs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_timeline_events (
  id          TEXT        PRIMARY KEY,
  job_id       TEXT       NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  event_type   TEXT       NOT NULL,
  actor        TEXT       NOT NULL DEFAULT 'system',
  from_status  TEXT,
  to_status    TEXT,
  note         TEXT,
  metadata     JSONB      NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT job_timeline_event_type_check CHECK (
    event_type IN (
      'status_change', 'note', 'attachment_added',
      'invoice_draft_created', 'invoice_draft_updated', 'ai_snapshot', 'system'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_job_timeline_events_job_id ON job_timeline_events (job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_timeline_events_type ON job_timeline_events (event_type);
ALTER TABLE job_timeline_events ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- attachments (metadata only; no binary in DB)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attachments (
  id           TEXT        PRIMARY KEY,
  job_id        TEXT       NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  upload_id     TEXT       REFERENCES uploads(id) ON DELETE SET NULL,
  kind          TEXT       NOT NULL,
  file_name     TEXT       NOT NULL,
  mime_type     TEXT,
  size_bytes    INTEGER,
  storage_path  TEXT,
  uploaded_by   TEXT       NOT NULL DEFAULT 'system',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT attachments_kind_check CHECK (kind IN ('photo', 'document'))
);

CREATE INDEX IF NOT EXISTS idx_attachments_job_id ON attachments (job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_upload_id ON attachments (upload_id) WHERE upload_id IS NOT NULL;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- invoices (draft only in v1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id              TEXT        PRIMARY KEY,
  job_id           TEXT       NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  invoice_number   TEXT,
  status           TEXT       NOT NULL DEFAULT 'draft',
  currency         TEXT       NOT NULL DEFAULT 'GBP',
  subtotal_pence   INTEGER,
  vat_pence        INTEGER,
  total_pence      INTEGER,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT invoices_status_check CHECK (status IN ('draft'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_job_id_unique ON invoices (job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);

DROP TRIGGER IF EXISTS invoices_updated_at ON invoices;
CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- ai_context_snapshots (optional v1, workshop AI only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_context_snapshots (
  id            TEXT        PRIMARY KEY,
  job_id          TEXT      NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source          TEXT      NOT NULL DEFAULT 'workshop_copilot',
  model           TEXT,
  prompt          TEXT,
  response        TEXT,
  context_json    JSONB     NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT      NOT NULL DEFAULT 'system',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_context_snapshots_source_check CHECK (
    source IN ('workshop_copilot')
  )
);

CREATE INDEX IF NOT EXISTS idx_ai_context_snapshots_job_id ON ai_context_snapshots (job_id, created_at DESC);
ALTER TABLE ai_context_snapshots ENABLE ROW LEVEL SECURITY;
