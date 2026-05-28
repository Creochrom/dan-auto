-- =============================================================================
-- Migration 009 — extend booking statuses for admin intake pipeline
-- Adds: rescheduled, rejected
-- =============================================================================

DO $$
BEGIN
  ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
  ALTER TABLE bookings
    ADD CONSTRAINT bookings_status_check CHECK (
      status IN (
        'new',
        'awaiting_callback',
        'confirmed',
        'rescheduled',
        'rejected',
        'in_progress',
        'completed'
      )
    );
END $$;
