-- =============================================================================
-- Migration 010 — vehicle timeline events (MOT + workshop lifecycle)
-- =============================================================================

CREATE TABLE IF NOT EXISTS vehicle_timeline_events (
  id            TEXT         PRIMARY KEY,
  vehicle_id    TEXT         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  event_type    TEXT         NOT NULL,
  source        TEXT         NOT NULL DEFAULT 'system',
  source_ref    TEXT,
  title         TEXT         NOT NULL,
  description   TEXT,
  event_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
  metadata      JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_timeline_event_type_check CHECK (
    event_type IN ('mot_test', 'job_status_change', 'system')
  )
);

CREATE INDEX IF NOT EXISTS idx_vehicle_timeline_events_vehicle_id
  ON vehicle_timeline_events (vehicle_id, event_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_timeline_events_event_type
  ON vehicle_timeline_events (event_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicle_timeline_events_source_ref
  ON vehicle_timeline_events (source_ref)
  WHERE source_ref IS NOT NULL;

ALTER TABLE vehicle_timeline_events ENABLE ROW LEVEL SECURITY;

-- Seed historical job status transitions into vehicle timeline.
INSERT INTO vehicle_timeline_events (
  id,
  vehicle_id,
  event_type,
  source,
  source_ref,
  title,
  description,
  event_at,
  metadata
)
SELECT
  'vte_seed_jse_' || jse.id,
  j.vehicle_id,
  'job_status_change',
  'job_status_event',
  'job_status:' || jse.id,
  'Job status: ' || jse.to_status,
  CASE
    WHEN jse.from_status IS NULL THEN NULL
    ELSE 'From ' || jse.from_status || ' to ' || jse.to_status
  END,
  jse.created_at,
  jsonb_build_object(
    'jobId', jse.job_id,
    'fromStatus', jse.from_status,
    'toStatus', jse.to_status,
    'actor', coalesce(jse.changed_by, 'system')
  )
FROM job_status_events jse
JOIN jobs j ON j.id = jse.job_id
WHERE j.vehicle_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM vehicle_timeline_events vte
    WHERE vte.id = 'vte_seed_jse_' || jse.id
  );
