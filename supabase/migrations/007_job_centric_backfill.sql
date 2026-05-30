-- =============================================================================
-- Migration 007 — Job-centric backfill (data only)
-- Dan Auto Centre
-- Requires 006_job_centric_schema.sql.
-- Safe to re-run: GROUP BY conflict keys before INSERT … ON CONFLICT; idempotent UPDATEs.
--
-- Fix for PostgreSQL 21000:
--   "ON CONFLICT DO UPDATE command cannot affect row a second time"
-- Old 006 used SELECT DISTINCT on display columns while ON CONFLICT targeted
-- registration_canonical / customers.id — duplicate source rows per conflict key.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Backfill vehicles — one row per canonical registration
-- ---------------------------------------------------------------------------
INSERT INTO vehicles (id, registration, registration_canonical)
SELECT
  'veh_' || canon,
  max(upper(registration)) AS registration,
  canon
FROM (
  SELECT
    registration,
    normalize_registration(registration) AS canon
  FROM bookings
  WHERE registration IS NOT NULL
    AND normalize_registration(registration) <> ''
) booking_regs
GROUP BY canon
ON CONFLICT (registration_canonical) DO UPDATE
SET registration = EXCLUDED.registration;

INSERT INTO vehicles (id, registration, registration_canonical)
SELECT
  'veh_' || canon,
  max(upper(registration)) AS registration,
  canon
FROM (
  SELECT
    registration,
    normalize_registration(registration) AS canon
  FROM jobs
  WHERE registration IS NOT NULL
    AND normalize_registration(registration) <> ''
) job_regs
GROUP BY canon
ON CONFLICT (registration_canonical) DO UPDATE
SET registration = EXCLUDED.registration;

-- ---------------------------------------------------------------------------
-- Backfill customers — one row per md5(phone|name) identity
-- ---------------------------------------------------------------------------
INSERT INTO customers (id, name, phone, email)
SELECT
  customer_id,
  max(btrim(customer_name)) AS name,
  max(btrim(customer_phone)) AS phone,
  max(customer_email) FILTER (
    WHERE customer_email IS NOT NULL AND btrim(customer_email) <> ''
  ) AS email
FROM (
  SELECT
    customer_name,
    customer_phone,
    customer_email,
    'cus_' || md5(
      lower(trim(customer_phone)) || '|' || coalesce(lower(trim(customer_name)), '')
    ) AS customer_id
  FROM bookings
  WHERE customer_phone IS NOT NULL
    AND trim(customer_phone) <> ''
) booking_customers
GROUP BY customer_id
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  email = coalesce(EXCLUDED.email, customers.email);

INSERT INTO customers (id, name, phone, email)
SELECT
  customer_id,
  max(btrim(customer_name)) AS name,
  max(btrim(customer_phone)) AS phone,
  NULL::TEXT AS email
FROM (
  SELECT
    customer_name,
    customer_phone,
    'cus_' || md5(
      lower(trim(customer_phone)) || '|' || coalesce(lower(trim(customer_name)), '')
    ) AS customer_id
  FROM jobs
  WHERE customer_phone IS NOT NULL
    AND trim(customer_phone) <> ''
) job_customers
GROUP BY customer_id
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;

-- ---------------------------------------------------------------------------
-- Link bookings and jobs to canonical entities
-- ---------------------------------------------------------------------------
UPDATE bookings b
SET vehicle_id = v.id
FROM vehicles v
WHERE b.registration IS NOT NULL
  AND normalize_registration(b.registration) = v.registration_canonical
  AND (b.vehicle_id IS NULL OR b.vehicle_id <> v.id);

UPDATE bookings b
SET customer_id = c.id
FROM customers c
WHERE c.id = 'cus_' || md5(
  lower(trim(b.customer_phone)) || '|' || coalesce(lower(trim(b.customer_name)), '')
)
  AND (b.customer_id IS NULL OR b.customer_id <> c.id);

UPDATE jobs j
SET vehicle_id = v.id
FROM vehicles v
WHERE j.registration IS NOT NULL
  AND normalize_registration(j.registration) = v.registration_canonical
  AND (j.vehicle_id IS NULL OR j.vehicle_id <> v.id);

UPDATE jobs j
SET customer_id = c.id
FROM customers c
WHERE c.id = 'cus_' || md5(
  lower(trim(j.customer_phone)) || '|' || coalesce(lower(trim(j.customer_name)), '')
)
  AND (j.customer_id IS NULL OR j.customer_id <> c.id);

-- ---------------------------------------------------------------------------
-- Align job_status_events with migration 004 contract.
-- Production may have the table from an earlier CREATE TABLE IF NOT EXISTS
-- no-op (table pre-dated 004 or was created without created_at). 007 and app
-- code assume the column exists per 004_workshop_jobs.sql.
-- ---------------------------------------------------------------------------
ALTER TABLE job_status_events
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- ---------------------------------------------------------------------------
-- Seed timeline with historical status events (idempotent)
-- ---------------------------------------------------------------------------
INSERT INTO job_timeline_events (
  id, job_id, event_type, actor, from_status, to_status, note, metadata, created_at
)
SELECT
  'jte_seed_' || jse.id,
  jse.job_id,
  'status_change',
  coalesce(jse.changed_by, 'system'),
  jse.from_status,
  jse.to_status,
  NULL,
  '{}'::jsonb,
  jse.created_at
FROM job_status_events jse
WHERE NOT EXISTS (
  SELECT 1 FROM job_timeline_events jte WHERE jte.id = 'jte_seed_' || jse.id
);
