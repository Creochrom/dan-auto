-- =============================================================================
-- Migration 011 — booking_change_events (audit trail for booking updates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS booking_change_events (
  id               TEXT        PRIMARY KEY,
  booking_id       TEXT        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type       TEXT        NOT NULL,
  changed_by       TEXT        NOT NULL DEFAULT 'system',
  previous_values  JSONB       NOT NULL DEFAULT '{}',
  new_values       JSONB       NOT NULL DEFAULT '{}',
  changed_fields   TEXT[]      NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT booking_change_events_type_check CHECK (
    event_type IN ('BOOKING_CREATED', 'BOOKING_UPDATED', 'BOOKING_CANCELLED')
  )
);

CREATE INDEX IF NOT EXISTS idx_booking_change_events_booking_id
  ON booking_change_events (booking_id);

CREATE INDEX IF NOT EXISTS idx_booking_change_events_created_at
  ON booking_change_events (created_at DESC);

ALTER TABLE booking_change_events ENABLE ROW LEVEL SECURITY;
