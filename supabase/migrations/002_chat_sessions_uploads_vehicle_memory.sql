-- =============================================================================
-- Migration 002 — chat_sessions, uploads, vehicle_memory
-- Dan Auto Centre
-- Run once:  supabase db push  or paste into the Supabase SQL editor.
-- Safe to re-run: all statements use IF NOT EXISTS / OR REPLACE.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- chat_sessions
-- Full ChatSession stored as JSONB (schema evolves without migrations).
-- Indexed scalars: id, created_at, updated_at.
-- All mutations are application-level read-modify-write on the data column.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
  id         TEXT        PRIMARY KEY,
  data       JSONB       NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions (created_at DESC);

-- Auto-update trigger (reuses function from migration 001)
DROP TRIGGER IF EXISTS chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS — service role bypasses; anon/authenticated blocked.
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- uploads
-- Stores upload metadata.  previewUrl is a base64 data URL for now.
-- NOTE: When Supabase Storage is wired (phase 3), the upload service will
-- store the actual bytes in a Storage bucket and save the signed URL instead
-- of embedding base64 here.  The column stays TEXT either way.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS uploads (
  id           TEXT        PRIMARY KEY,
  file_name    TEXT        NOT NULL,
  mime_type    TEXT        NOT NULL,
  size_bytes   INTEGER     NOT NULL,
  category     TEXT        NOT NULL,
  preview_url  TEXT        NOT NULL,
  vision_ready BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uploads_category_check CHECK (
    category IN (
      'warning_light', 'noise_video', 'damage', 'leak',
      'smoke', 'tyre', 'suspension', 'general'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads (created_at DESC);

-- RLS
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- vehicle_memory
-- Keyed by canonical (uppercase, no-space) registration.
-- vehicle / customer / intakes stored as JSONB — flexible as intake schema
-- evolves.  first_seen_at / last_seen_at indexed for returning-customer lookup.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_memory (
  reg            TEXT        PRIMARY KEY,
  reg_display    TEXT        NOT NULL,
  vehicle        JSONB       NOT NULL DEFAULT '{}',
  customer       JSONB       NOT NULL DEFAULT '{}',
  intakes        JSONB       NOT NULL DEFAULT '[]',
  first_seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_memory_last_seen ON vehicle_memory (last_seen_at DESC);

-- RLS
ALTER TABLE vehicle_memory ENABLE ROW LEVEL SECURITY;
