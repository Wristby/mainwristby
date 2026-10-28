-- Keep a dated record of every saved Price Listed At change.
CREATE TABLE IF NOT EXISTS inventory_price_history (
  id serial PRIMARY KEY,
  inventory_id integer REFERENCES inventory(id),
  list_price integer NOT NULL,
  recorded_at timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS inventory_price_history_watch_date_idx
  ON inventory_price_history (inventory_id, recorded_at);

-- Existing values become tracking baselines; earlier price changes are unavailable.
INSERT INTO inventory_price_history (inventory_id, list_price, recorded_at)
SELECT i.id, i.list_price, now()
FROM inventory i
WHERE i.list_price IS NOT NULL
  AND i.list_price > 0
  AND NOT EXISTS (
    SELECT 1
    FROM inventory_price_history h
    WHERE h.inventory_id = i.id
  );
