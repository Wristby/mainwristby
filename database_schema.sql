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
    sold_platform TEXT,
    
    -- Foreign Keys
    client_id INTEGER REFERENCES clients(id),
    buyer_id INTEGER REFERENCES clients(id)
);

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
