-- Additive only. No cleanup, backfill of identity, approved periods or scheduler.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_updated_at timestamp DEFAULT now() NOT NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS profile_cleared_at timestamp;
CREATE TABLE IF NOT EXISTS retention_holds (
  id serial PRIMARY KEY,
  scope text NOT NULL,
  record_id integer NOT NULL,
  reason text NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL,
  released_at timestamp,
  release_reason text
);
CREATE TABLE IF NOT EXISTS transaction_parties (
  id serial PRIMARY KEY,
  inventory_id integer NOT NULL REFERENCES inventory(id),
  role text NOT NULL,
  name text NOT NULL,
  retained_at timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS retention_audit (
  id serial PRIMARY KEY,
  action text NOT NULL,
  record_id integer,
  revision text,
  created_at timestamp DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS retention_policies (
  revision text PRIMARY KEY,
  schedule jsonb NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
);
