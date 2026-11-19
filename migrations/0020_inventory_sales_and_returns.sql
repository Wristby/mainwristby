CREATE TABLE IF NOT EXISTS inventory_sales (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    cycle_number INTEGER NOT NULL,
    brand_snapshot TEXT NOT NULL,
    model_snapshot TEXT NOT NULL,
    reference_number_snapshot TEXT NOT NULL,
    serial_number_snapshot TEXT,
    sale_price INTEGER NOT NULL DEFAULT 0,
    sold_to TEXT,
    buyer_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    platform_fees INTEGER NOT NULL DEFAULT 0,
    chrono24_fee_rate INTEGER,
    shipping_fee INTEGER NOT NULL DEFAULT 0,
    insurance_fee INTEGER NOT NULL DEFAULT 0,
    sold_date TIMESTAMP,
    sold_platform TEXT,
    shipping_partner TEXT,
    tracking_number TEXT,
    date_shipped TIMESTAMP,
    delivered_date DATE,
    purchase_date_snapshot TIMESTAMP,
    date_listed_snapshot TIMESTAMP,
    purchase_price_snapshot INTEGER NOT NULL DEFAULT 0,
    import_fee_snapshot INTEGER NOT NULL DEFAULT 0,
    service_fee_snapshot INTEGER NOT NULL DEFAULT 0,
    polish_fee_snapshot INTEGER NOT NULL DEFAULT 0,
    watch_register_fee_snapshot INTEGER NOT NULL DEFAULT 0,
    watch_register_snapshot BOOLEAN NOT NULL DEFAULT FALSE,
    acquisition_cost_cents INTEGER NOT NULL DEFAULT 0,
    profit_at_sale_cents INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT inventory_sales_cycle_number_positive CHECK (cycle_number > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_sales_watch_cycle_unique
    ON inventory_sales (inventory_id, cycle_number);
CREATE INDEX IF NOT EXISTS inventory_sales_sold_date_idx
    ON inventory_sales (sold_date);

CREATE TABLE IF NOT EXISTS inventory_returns (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES inventory_sales(id),
    status TEXT NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested', 'approved', 'in_transit', 'received', 'inspected', 'completed', 'cancelled', 'declined')),
    request_date DATE NOT NULL,
    reason TEXT NOT NULL DEFAULT '',
    return_shipped_date DATE,
    received_date DATE,
    carrier TEXT,
    tracking_number TEXT,
    shipping_cost_cents INTEGER NOT NULL DEFAULT 0,
    shipping_payer TEXT NOT NULL DEFAULT 'seller'
        CHECK (shipping_payer IN ('seller', 'buyer', 'marketplace')),
    refund_amount_cents INTEGER NOT NULL DEFAULT 0,
    refund_date DATE,
    inspection_condition TEXT,
    missing_items TEXT,
    inspection_notes TEXT,
    inspection_cost_cents INTEGER NOT NULL DEFAULT 0,
    next_action TEXT NOT NULL DEFAULT 'hold'
        CHECK (next_action IN ('relist', 'service', 'hold')),
    cogs_restored_cents INTEGER NOT NULL DEFAULT 0,
    platform_fee_refunded BOOLEAN NOT NULL DEFAULT FALSE,
    completed_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT inventory_returns_nonnegative_amounts CHECK (
        shipping_cost_cents >= 0
        AND refund_amount_cents >= 0
        AND inspection_cost_cents >= 0
        AND cogs_restored_cents >= 0
    )
);

CREATE INDEX IF NOT EXISTS inventory_returns_sale_idx
    ON inventory_returns (sale_id, created_at);
CREATE INDEX IF NOT EXISTS inventory_returns_received_idx
    ON inventory_returns (received_date);

-- Preserve each existing sale as the first history cycle. The source inventory
-- row is not modified, and later cPanel deployments retain the original sale.
INSERT INTO inventory_sales (
    inventory_id, cycle_number, brand_snapshot, model_snapshot,
    reference_number_snapshot, serial_number_snapshot, sale_price, sold_to, buyer_id,
    platform_fees, chrono24_fee_rate, shipping_fee, insurance_fee, sold_date,
    sold_platform, shipping_partner, tracking_number, date_shipped, delivered_date,
    purchase_date_snapshot, date_listed_snapshot,
    purchase_price_snapshot, import_fee_snapshot, service_fee_snapshot,
    polish_fee_snapshot, watch_register_fee_snapshot, watch_register_snapshot,
    acquisition_cost_cents, profit_at_sale_cents
)
SELECT
    i.id,
    1,
    i.brand,
    i.model,
    i.reference_number,
    i.serial_number,
    CASE
        WHEN COALESCE(i.sale_price, 0) = 0 AND COALESCE(i.sold_price, 0) <> 0 THEN i.sold_price
        ELSE COALESCE(i.sale_price, i.sold_price, 0)
    END,
    i.sold_to,
    i.buyer_id,
    COALESCE(i.platform_fees, 0),
    i.chrono24_fee_rate,
    COALESCE(i.shipping_fee, 0),
    COALESCE(i.insurance_fee, 0),
    COALESCE(i.sold_date, i.date_sold),
    i.sold_platform,
    i.shipping_partner,
    i.tracking_number,
    i.date_shipped,
    i.delivered_date,
    i.purchase_date,
    i.date_listed,
    COALESCE(i.purchase_price, 0),
    COALESCE(i.import_fee, 0),
    COALESCE(i.service_fee, 0),
    COALESCE(i.polish_fee, 0),
    CASE
        WHEN COALESCE(i.watch_register, FALSE) THEN
            COALESCE(
                i.watch_register_fee_snapshot,
                (SELECT NULLIF(value #>> '{}', '')::INTEGER FROM settings WHERE key = 'watch_register_fee'),
                600
            )
        ELSE 0
    END,
    COALESCE(i.watch_register, FALSE),
    COALESCE(i.purchase_price, 0)
        + COALESCE(i.import_fee, 0)
        + COALESCE(i.service_fee, 0)
        + COALESCE(i.polish_fee, 0)
        + CASE
            WHEN COALESCE(i.watch_register, FALSE) THEN COALESCE(
                i.watch_register_fee_snapshot,
                (SELECT NULLIF(value #>> '{}', '')::INTEGER FROM settings WHERE key = 'watch_register_fee'),
                600
            )
            ELSE 0
        END,
    CASE
        WHEN COALESCE(i.sale_price, 0) = 0 AND COALESCE(i.sold_price, 0) <> 0 THEN i.sold_price
        ELSE COALESCE(i.sale_price, i.sold_price, 0)
    END
        - COALESCE(i.purchase_price, 0)
        - COALESCE(i.import_fee, 0)
        - COALESCE(i.service_fee, 0)
        - COALESCE(i.polish_fee, 0)
        - CASE
            WHEN COALESCE(i.watch_register, FALSE) THEN COALESCE(
                i.watch_register_fee_snapshot,
                (SELECT NULLIF(value #>> '{}', '')::INTEGER FROM settings WHERE key = 'watch_register_fee'),
                600
            )
            ELSE 0
        END
        - COALESCE(i.platform_fees, 0)
        - COALESCE(i.shipping_fee, 0)
        - COALESCE(i.insurance_fee, 0)
FROM inventory i
WHERE (
    i.status = 'sold'
    OR COALESCE(i.sale_price, 0) <> 0
    OR COALESCE(i.sold_price, 0) <> 0
    OR i.sold_date IS NOT NULL
    OR i.date_sold IS NOT NULL
)
AND NOT EXISTS (
    SELECT 1 FROM inventory_sales existing
    WHERE existing.inventory_id = i.id AND existing.cycle_number = 1
);
