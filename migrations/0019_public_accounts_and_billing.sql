-- Public multi-account launch foundation.
-- Apply manually to cPanel only after confirming the live database state and backup.
BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_role varchar(20) NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS subscription_status varchar(32) NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_customer_id varchar(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id varchar(255),
  ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash varchar(64),
  ADD COLUMN IF NOT EXISTS email_verification_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS password_reset_token_hash varchar(64),
  ADD COLUMN IF NOT EXISTS password_reset_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version varchar(40),
  ADD COLUMN IF NOT EXISTS privacy_notice_version varchar(40);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_id varchar;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS owner_id varchar;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS owner_id varchar;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS owner_id varchar;
ALTER TABLE dealer_notebook_entries ADD COLUMN IF NOT EXISTS owner_id varchar;
ALTER TABLE retention_holds ADD COLUMN IF NOT EXISTS owner_id varchar;
ALTER TABLE transaction_parties ADD COLUMN IF NOT EXISTS owner_id varchar;
ALTER TABLE retention_audit ADD COLUMN IF NOT EXISTS owner_id varchar;
ALTER TABLE retention_policies ADD COLUMN IF NOT EXISTS owner_id varchar;
ALTER TABLE inventory_price_history ADD COLUMN IF NOT EXISTS owner_id varchar;
ALTER TABLE personal_collection_valuations ADD COLUMN IF NOT EXISTS owner_id varchar;

DO $$
DECLARE
  existing_user_count integer;
  existing_owner_id varchar;
BEGIN
  SELECT count(*), min(id) INTO existing_user_count, existing_owner_id FROM users;
  IF existing_user_count <> 1 THEN
    RAISE EXCEPTION 'Public-account migration requires exactly one existing WRISTBY user so historical records can be assigned safely; found %.', existing_user_count;
  END IF;

  -- The existing shared workspace belongs to its sole current account.
  UPDATE users
    SET account_role = 'owner', email_verified_at = COALESCE(email_verified_at, now())
    WHERE id = existing_owner_id;
  UPDATE clients SET owner_id = existing_owner_id WHERE owner_id IS NULL;
  UPDATE inventory SET owner_id = existing_owner_id WHERE owner_id IS NULL;
  UPDATE expenses SET owner_id = existing_owner_id WHERE owner_id IS NULL;
  UPDATE settings SET owner_id = existing_owner_id WHERE owner_id IS NULL;
  UPDATE dealer_notebook_entries SET owner_id = existing_owner_id WHERE owner_id IS NULL;
  UPDATE retention_holds SET owner_id = existing_owner_id WHERE owner_id IS NULL;
  UPDATE transaction_parties SET owner_id = existing_owner_id WHERE owner_id IS NULL;
  UPDATE retention_audit SET owner_id = existing_owner_id WHERE owner_id IS NULL;
  UPDATE retention_policies SET owner_id = existing_owner_id WHERE owner_id IS NULL;
  UPDATE inventory_price_history SET owner_id = existing_owner_id WHERE owner_id IS NULL;
  UPDATE personal_collection_valuations AS valuation
    SET owner_id = watch.owner_id
    FROM personal_collection_watches AS watch
    WHERE valuation.watch_id = watch.id AND valuation.owner_id IS NULL;

  IF EXISTS (SELECT 1 FROM personal_collection_valuations WHERE owner_id IS NULL) THEN
    RAISE EXCEPTION 'Personal collection valuations could not be mapped to an existing owner.';
  END IF;
END
$$;

ALTER TABLE clients ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE inventory ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE settings ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE dealer_notebook_entries ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE retention_holds ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE transaction_parties ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE retention_audit ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE retention_policies ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE inventory_price_history ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE personal_collection_valuations ALTER COLUMN owner_id SET NOT NULL;

ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_pkey;
ALTER TABLE settings ADD CONSTRAINT settings_owner_key_pkey PRIMARY KEY (owner_id, key);

ALTER TABLE dealer_notebook_entries DROP CONSTRAINT IF EXISTS dealer_notebook_entries_pkey;
ALTER TABLE dealer_notebook_entries ADD CONSTRAINT dealer_notebook_owner_month_pkey PRIMARY KEY (owner_id, month_key);

ALTER TABLE retention_policies DROP CONSTRAINT IF EXISTS retention_policies_pkey;
ALTER TABLE retention_policies ADD CONSTRAINT retention_policies_owner_revision_pkey PRIMARY KEY (owner_id, revision);

CREATE INDEX IF NOT EXISTS clients_owner_created_idx ON clients (owner_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS clients_owner_id_idx ON clients (owner_id, id);
CREATE INDEX IF NOT EXISTS inventory_owner_status_idx ON inventory (owner_id, status, archived_at);
CREATE INDEX IF NOT EXISTS inventory_owner_purchase_date_idx ON inventory (owner_id, purchase_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS inventory_owner_id_idx ON inventory (owner_id, id);
CREATE INDEX IF NOT EXISTS expenses_owner_date_idx ON expenses (owner_id, date DESC);
DROP INDEX IF EXISTS inventory_price_history_watch_date_idx;
CREATE INDEX inventory_price_history_watch_date_idx
  ON inventory_price_history (owner_id, inventory_id, recorded_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS personal_collection_owner_id_idx
  ON personal_collection_watches (owner_id, id);
DROP INDEX IF EXISTS personal_collection_valuation_watch_date_idx;
CREATE INDEX personal_collection_valuation_watch_date_idx
  ON personal_collection_valuations (owner_id, watch_id, valuation_date DESC, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_uq
  ON users (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_subscription_id_uq
  ON users (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique_idx
  ON users (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_unique_idx
  ON users (lower(username)) WHERE username IS NOT NULL;

ALTER TABLE clients ADD CONSTRAINT clients_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE inventory ADD CONSTRAINT inventory_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE expenses ADD CONSTRAINT expenses_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE settings ADD CONSTRAINT settings_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE dealer_notebook_entries ADD CONSTRAINT dealer_notebook_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE retention_holds ADD CONSTRAINT retention_holds_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE transaction_parties ADD CONSTRAINT transaction_parties_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE retention_audit ADD CONSTRAINT retention_audit_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE retention_policies ADD CONSTRAINT retention_policies_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE inventory_price_history ADD CONSTRAINT inventory_price_history_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE personal_collection_valuations ADD CONSTRAINT personal_collection_valuations_owner_user_fk
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

-- Replace legacy single-column references with tenant-aware constraints so a
-- forged client/watch ID cannot create a cross-account relationship.
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_client_id_clients_id_fk;
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_buyer_id_clients_id_fk;
ALTER TABLE inventory ADD CONSTRAINT inventory_owner_seller_fk
  FOREIGN KEY (owner_id, client_id) REFERENCES clients(owner_id, id);
ALTER TABLE inventory ADD CONSTRAINT inventory_owner_buyer_fk
  FOREIGN KEY (owner_id, buyer_id) REFERENCES clients(owner_id, id);

ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_inventory_id_inventory_id_fk;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_inventory_id_fkey;
ALTER TABLE expenses ADD CONSTRAINT expenses_owner_inventory_fk
  FOREIGN KEY (owner_id, inventory_id) REFERENCES inventory(owner_id, id);

ALTER TABLE transaction_parties DROP CONSTRAINT IF EXISTS transaction_parties_inventory_id_fkey;
ALTER TABLE transaction_parties ADD CONSTRAINT transaction_parties_owner_inventory_fk
  FOREIGN KEY (owner_id, inventory_id) REFERENCES inventory(owner_id, id);

ALTER TABLE inventory_price_history DROP CONSTRAINT IF EXISTS inventory_price_history_inventory_id_fkey;
ALTER TABLE inventory_price_history DROP CONSTRAINT IF EXISTS inventory_price_history_inventory_id_inventory_id_fk;
ALTER TABLE inventory_price_history ADD CONSTRAINT inventory_price_history_owner_inventory_fk
  FOREIGN KEY (owner_id, inventory_id) REFERENCES inventory(owner_id, id);

ALTER TABLE personal_collection_valuations DROP CONSTRAINT IF EXISTS personal_collection_valuations_watch_id_fkey;
ALTER TABLE personal_collection_valuations DROP CONSTRAINT IF EXISTS personal_collection_valuations_watch_id_personal_collection_watches_id_fk;
ALTER TABLE personal_collection_valuations ADD CONSTRAINT personal_collection_valuation_owner_watch_fk
  FOREIGN KEY (owner_id, watch_id) REFERENCES personal_collection_watches(owner_id, id) ON DELETE CASCADE;

COMMIT;
