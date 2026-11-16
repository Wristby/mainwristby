ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS chrono24_certification_sent_at TIMESTAMPTZ;
