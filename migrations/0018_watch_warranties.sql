ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS store_warranty_months INTEGER,
  ADD COLUMN IF NOT EXISTS manufacturer_purchase_date DATE,
  ADD COLUMN IF NOT EXISTS manufacturer_warranty_expires DATE,
  ADD COLUMN IF NOT EXISTS manufacturer_warranty_card_present BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manufacturer_warranty_details TEXT;
