-- Preserve full watch history while allowing it to be removed from active inventory.
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS archived_at timestamp;
