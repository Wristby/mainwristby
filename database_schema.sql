-- WRISTBY Database Schema
-- PostgreSQL Compatible SQL Script
-- Creates all tables for the luxury watch inventory management system

-- Enable UUID extension for user IDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- SESSIONS TABLE (for express-session)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- =============================================
-- USERS TABLE (authentication)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- CLIENTS TABLE (buyers and dealers)
-- =============================================
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    social_handle TEXT,
    website TEXT,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    type TEXT NOT NULL DEFAULT 'client' CHECK (type IN ('client', 'dealer')),
    notes TEXT,
    is_vip BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- INVENTORY TABLE (watches)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    serial_number TEXT,
    internal_serial TEXT,
    year INTEGER,
    
    -- Purchase Details
    purchased_from TEXT,
    paid_with TEXT,
    purchase_price INTEGER NOT NULL,
    import_fee INTEGER DEFAULT 0,
    watch_register BOOLEAN DEFAULT FALSE,
    
    -- Service & Preparation Costs (stored in cents)
    service_fee INTEGER DEFAULT 0,
    polish_fee INTEGER DEFAULT 0,
    service_start_date TIMESTAMP,
    date_sent_to_service TIMESTAMP,
    date_returned_from_service TIMESTAMP,
    service_notes TEXT,
    
    -- Sale Details (stored in cents)
    sale_price INTEGER DEFAULT 0,
    sold_to TEXT,
    platform_fees INTEGER DEFAULT 0,
    shipping_fee INTEGER DEFAULT 0,
    insurance_fee INTEGER DEFAULT 0,
    
    -- Legacy fields (keeping for compatibility)
    target_sell_price INTEGER NOT NULL,
    sold_price INTEGER,
    
    -- Dates
    date_received TIMESTAMP,
    purchase_date TIMESTAMP,
    date_listed TIMESTAMP,
    sold_date TIMESTAMP,
    date_sold TIMESTAMP,
    list_price INTEGER,
    
    -- Details
    condition TEXT NOT NULL CHECK (condition IN ('New', 'Mint', 'Used', 'Damaged')),
    status TEXT NOT NULL DEFAULT 'incoming' CHECK (status IN ('in_stock', 'sold', 'incoming', 'servicing', 'received')),
    box BOOLEAN NOT NULL DEFAULT FALSE,
    papers BOOLEAN NOT NULL DEFAULT FALSE,
    images TEXT[],
    gdrive_link TEXT,
    notes TEXT,
    
    -- Shipping & Tracking
    shipping_partner TEXT,
    tracking_number TEXT,
    chrono24_certification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    chrono24_certification_sent_at TIMESTAMPTZ,
    sold_platform TEXT,
    store_warranty_months INTEGER,
    manufacturer_purchase_date DATE,
    manufacturer_warranty_expires DATE,
    manufacturer_warranty_card_present BOOLEAN NOT NULL DEFAULT FALSE,
    manufacturer_warranty_details TEXT,
    
    -- Foreign Keys
    client_id INTEGER REFERENCES clients(id),
    buyer_id INTEGER REFERENCES clients(id)
);

-- =============================================
-- SALE HISTORY AND RETURNS
-- =============================================
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS inventory_returns_sale_idx
    ON inventory_returns (sale_id, created_at);
CREATE INDEX IF NOT EXISTS inventory_returns_received_idx
    ON inventory_returns (received_date);

-- =============================================
-- PERSONAL COLLECTION (private, not store inventory)
-- =============================================
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
    gdrive_link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personal_collection_owner_idx
    ON personal_collection_watches (owner_id);
CREATE INDEX IF NOT EXISTS personal_collection_owner_bought_idx
    ON personal_collection_watches (owner_id, date_bought);

-- Dated private estimates for personal watches; deleting a personal watch
-- removes only its own valuation entries.
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

-- Price Listed At history; inventory_id is detached when a watch is deleted,
-- preserving the history without retaining a link to the deleted watch.
CREATE TABLE IF NOT EXISTS inventory_price_history (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id),
    list_price INTEGER NOT NULL,
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventory_price_history_watch_date_idx
    ON inventory_price_history (inventory_id, recorded_at);

-- =============================================
-- EXPENSES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id),
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT NOW(),
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN (
        'marketing',
        'rent_storage',
        'subscriptions',
        'tools',
        'insurance',
        'service',
        'shipping',
        'parts',
        'platform_fees',
        'other'
    )),
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================
-- SETTINGS TABLE (key-value store for app config)
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Saved monthly AI reviews, owner context, and follow-up actions.
CREATE TABLE IF NOT EXISTS dealer_notebook_entries (
    month_key VARCHAR(7) PRIMARY KEY,
    comparison_mode TEXT NOT NULL DEFAULT 'previous-month'
        CHECK (comparison_mode IN ('previous-month', 'same-month-last-year', 'prior-three-months')),
    context_note TEXT NOT NULL DEFAULT '',
    report JSONB,
    inventory_snapshot JSONB,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_brand ON inventory(brand);
CREATE INDEX IF NOT EXISTS idx_inventory_client_id ON inventory(client_id);
CREATE INDEX IF NOT EXISTS idx_inventory_buyer_id ON inventory(buyer_id);
CREATE INDEX IF NOT EXISTS idx_expenses_inventory_id ON expenses(inventory_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_is_vip ON clients(is_vip);
