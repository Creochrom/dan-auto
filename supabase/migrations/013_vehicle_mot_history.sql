-- Cached DVSA MOT History API responses (one row per registration).
CREATE TABLE IF NOT EXISTS vehicle_mot_history (
  registration TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'dvsa'
);

CREATE INDEX IF NOT EXISTS vehicle_mot_history_fetched_at_idx
  ON vehicle_mot_history (fetched_at DESC);
