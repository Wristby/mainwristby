-- Keep retained buyer/seller identity rows after their watch is removed.
ALTER TABLE transaction_parties ALTER COLUMN inventory_id DROP NOT NULL;
