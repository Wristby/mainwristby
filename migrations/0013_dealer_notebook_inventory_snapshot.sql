ALTER TABLE dealer_notebook_entries
  ADD COLUMN IF NOT EXISTS inventory_snapshot JSONB;
