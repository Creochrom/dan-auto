-- Migration 014: workshop_closures
-- Multi-day workshop holiday / closure periods (inclusive date range).
-- Sundays remain permanently closed in application logic (lib/workshop/availability.ts).

CREATE TABLE IF NOT EXISTS workshop_closures (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE        NOT NULL,
  end_date   DATE        NOT NULL,
  reason     TEXT        NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workshop_closures_range_valid CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_workshop_closures_range
  ON workshop_closures (start_date, end_date);

ALTER TABLE workshop_closures ENABLE ROW LEVEL SECURITY;

-- Public read — needed by booking slot availability (customers + AI).
CREATE POLICY "workshop_closures_read_public"
  ON workshop_closures FOR SELECT
  USING (true);

-- Writes only via service-role (server-side admin API).
CREATE POLICY "workshop_closures_write_service_role"
  ON workshop_closures FOR ALL
  USING (auth.role() = 'service_role');
