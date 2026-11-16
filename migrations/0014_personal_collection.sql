CREATE TABLE IF NOT EXISTS personal_collection_watches (
  id SERIAL PRIMARY KEY,
  owner_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_bought DATE,
  reference_number TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT,
  sub_model TEXT,
  condition TEXT NOT NULL DEFAULT 'Pre-owned',
  condition_grade TEXT NOT NULL DEFAULT 'Not graded',
  year INTEGER,
  serial_number TEXT,
  link_count TEXT,
  bracelet TEXT,
  bezel TEXT,
  dial TEXT,
  box BOOLEAN NOT NULL DEFAULT FALSE,
  box_for_wholesale BOOLEAN NOT NULL DEFAULT FALSE,
  papers BOOLEAN NOT NULL DEFAULT FALSE,
  warranty_card_date DATE,
  warranty_expiration DATE,
  condition_notes TEXT,
  contents_notes TEXT,
  acquisition_platform TEXT,
  trade_in BOOLEAN NOT NULL DEFAULT FALSE,
  bought_from TEXT,
  purchase_price INTEGER,
  estimated_value INTEGER,
  msrp INTEGER,
  intake_fees JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  technical_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personal_collection_owner_idx
  ON personal_collection_watches (owner_id);

CREATE INDEX IF NOT EXISTS personal_collection_owner_bought_idx
  ON personal_collection_watches (owner_id, date_bought);
