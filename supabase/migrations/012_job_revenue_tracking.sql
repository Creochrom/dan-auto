-- =============================================================================
-- Migration 012 — Job revenue tracking (workshop operations, not accounting)
-- =============================================================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimated_value_pence INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_quote_pence INTEGER;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS final_invoice_pence INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_estimated_value_pence_nonneg'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_estimated_value_pence_nonneg
      CHECK (estimated_value_pence IS NULL OR estimated_value_pence >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_approved_quote_pence_nonneg'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_approved_quote_pence_nonneg
      CHECK (approved_quote_pence IS NULL OR approved_quote_pence >= 0);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_final_invoice_pence_nonneg'
  ) THEN
    ALTER TABLE jobs
      ADD CONSTRAINT jobs_final_invoice_pence_nonneg
      CHECK (final_invoice_pence IS NULL OR final_invoice_pence >= 0);
  END IF;
END $$;
