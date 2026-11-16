CREATE TABLE IF NOT EXISTS personal_collection_valuations (
  id SERIAL PRIMARY KEY,
  watch_id INTEGER NOT NULL REFERENCES personal_collection_watches(id) ON DELETE CASCADE,
  valuation_date DATE NOT NULL,
  estimated_value INTEGER NOT NULL CHECK (estimated_value >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personal_collection_valuation_watch_date_idx
  ON personal_collection_valuations (watch_id, valuation_date DESC, created_at DESC);
