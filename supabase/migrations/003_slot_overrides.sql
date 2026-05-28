-- Migration 003: slot_overrides
-- Admin-driven per-day availability. Default state: all standard time slots open.
-- Rows are only inserted when a day deviates from the default.

CREATE TABLE IF NOT EXISTS slot_overrides (
  date         DATE        PRIMARY KEY,
  is_closed    BOOLEAN     NOT NULL DEFAULT FALSE,
  -- Explicit list of blocked time strings (e.g. '{"09:00","10:30"}').
  -- NULL means "use the default full grid".
  closed_slots TEXT[]      NULL,
  -- Daily booking cap (NULL = unlimited / use global default).
  capacity     SMALLINT    NULL CHECK (capacity IS NULL OR capacity > 0),
  note         TEXT        NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: public can read (needed by /api/booking-slots).
-- Only service-role key (server-side) can write.
ALTER TABLE slot_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "slot_overrides_read_public"
  ON slot_overrides FOR SELECT
  USING (true);

CREATE POLICY "slot_overrides_write_service_role"
  ON slot_overrides FOR ALL
  USING (auth.role() = 'service_role');

-- Helpful index for date-range queries (e.g. admin calendar view).
CREATE INDEX IF NOT EXISTS idx_slot_overrides_date ON slot_overrides (date);
