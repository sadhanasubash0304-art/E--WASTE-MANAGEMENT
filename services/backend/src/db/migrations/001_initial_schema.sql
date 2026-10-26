-- EcoCircuit Database Migration 001
-- PostgreSQL 15 DDL for Smart E-Waste Management & Circular Economy Platform

-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 1. Roles & Permissions Table
CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(30) PRIMARY KEY,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email CITEXT UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(30) NOT NULL REFERENCES roles(name) ON DELETE RESTRICT,
    password_hash VARCHAR(255),
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    mfa_secret VARCHAR(64),
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'en', -- 'en', 'ta', 'hi'
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED', 'PENDING'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Hubs Table
CREATE TABLE IF NOT EXISTS hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    capacity_kg_per_day NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Hub Workers Table
CREATE TABLE IF NOT EXISTS hub_workers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hub_id UUID NOT NULL REFERENCES hubs(id) ON DELETE RESTRICT,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    certified_for_hazards BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hub_workers_hub ON hub_workers(hub_id);

-- 5. Material Composition Lookup Table
CREATE TABLE IF NOT EXISTS material_composition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_category VARCHAR(60) NOT NULL, -- e.g., 'smartphone', 'laptop', 'crt_monitor', 'tablet', 'server'
    component_name VARCHAR(80) NOT NULL,  -- e.g., 'pcb', 'lithium_battery', 'copper_heatsink', 'display_panel'
    weight_kg NUMERIC(6, 4) NOT NULL,     -- Typical component weight in kg
    recovery_yield_pct NUMERIC(5, 2) NOT NULL, -- Typical recovery yield (0-100%)
    primary_material VARCHAR(50) NOT NULL,     -- 'copper', 'gold', 'palladium', 'lithium', 'aluminum'
    hazard_class VARCHAR(50) NOT NULL DEFAULT 'SAFE', -- 'SAFE', 'CAUTION', 'HAZARDOUS'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_material_comp_cat ON material_composition(device_category);

-- 6. Gadget Listings Table
CREATE TABLE IF NOT EXISTS gadget_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_category VARCHAR(60) NOT NULL,
    brand VARCHAR(80) NOT NULL,
    model VARCHAR(100) NOT NULL,
    physical_condition VARCHAR(50) NOT NULL, -- 'LIKE_NEW', 'WORKING_MINOR_DEFECTS', 'DEAD_NON_WORKING'
    estimated_points INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL DEFAULT 'SUBMITTED', -- 'DRAFT', 'SUBMITTED', 'SCHEDULED', 'IN_TRANSIT', 'RECEIVED_AT_HUB', 'VERIFIED', 'REJECTED'
    intake_type VARCHAR(30) NOT NULL DEFAULT 'HUB_DROPOFF', -- 'PICKUP', 'HUB_DROPOFF'
    hub_id UUID REFERENCES hubs(id),
    scheduled_slot TIMESTAMPTZ,
    tracking_code VARCHAR(32) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listings_user ON gadget_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON gadget_listings(status);

-- 7. Listing Photos Table
CREATE TABLE IF NOT EXISTS listing_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES gadget_listings(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type VARCHAR(40) NOT NULL DEFAULT 'DEVICE_VIEW', -- 'FRONT', 'BACK', 'IMEI_LABEL', 'DAMAGE_DETAIL'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_photos_listing ON listing_photos(listing_id);

-- 8. Valuations Table
CREATE TABLE IF NOT EXISTS valuations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES gadget_listings(id) ON DELETE CASCADE,
    base_points INTEGER NOT NULL,
    final_verified_points INTEGER,
    commodity_rates_snapshot JSONB NOT NULL, -- { copper: 850, gold: 6200000, palladium: 3100000, lithium: 1800 }
    calculation_breakdown JSONB NOT NULL,    -- Detailed per-component weight x yield x rate
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_valuations_listing ON valuations(listing_id);

-- 9. Pickups & Dropoffs Table
CREATE TABLE IF NOT EXISTS pickups_dropoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES gadget_listings(id) ON DELETE CASCADE,
    hub_id UUID NOT NULL REFERENCES hubs(id),
    worker_id UUID REFERENCES hub_workers(id),
    intake_type VARCHAR(30) NOT NULL, -- 'PICKUP', 'HUB_DROPOFF'
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SCHEDULED', 'RECEIVED', 'VERIFIED', 'REJECTED'
    scheduled_time TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Points Ledger Table (ACID append-only immutable ledger)
CREATE TABLE IF NOT EXISTS points_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(40) NOT NULL, -- 'CREDIT_VERIFICATION', 'DEBIT_REDEMPTION', 'MANUAL_ADJUSTMENT', 'REVERSAL'
    points INTEGER NOT NULL, -- Positive for credit, negative for debit
    balance_after INTEGER NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    reference_id UUID NOT NULL,
    reference_type VARCHAR(50) NOT NULL, -- 'GADGET_LISTING', 'REDEMPTION', 'MANUAL'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_ledger_idempotency ON points_ledger(idempotency_key);

-- 11. Voucher Inventory Table
CREATE TABLE IF NOT EXISTS voucher_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(40) NOT NULL, -- 'AMAZON', 'FLIPKART', 'CROMA'
    voucher_code_hash VARCHAR(64) UNIQUE NOT NULL,
    voucher_code_encrypted TEXT NOT NULL,
    masked_code VARCHAR(20) NOT NULL, -- e.g., 'AMZN-****-4821'
    denomination_inr NUMERIC(10, 2) NOT NULL,
    points_cost INTEGER NOT NULL, -- Minimum 500
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'RESERVED', 'REDEEMED', 'EXPIRED'
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_vouchers_provider ON voucher_inventory(provider, status);

-- 12. Redemptions Table
CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    voucher_id UUID NOT NULL REFERENCES voucher_inventory(id) ON DELETE RESTRICT,
    points_debited INTEGER NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    revealed_code VARCHAR(64) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON redemptions(user_id);

-- 13. Safety Guidelines Table (India E-Waste Rules 2022)
CREATE TABLE IF NOT EXISTS safety_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hazard_class VARCHAR(50) UNIQUE NOT NULL, -- 'LI_ION_BATTERY', 'CRT_LEAD', 'MERCURY_SWITCH', 'PCB_CAPACITOR', 'TONER_POWDER'
    component_name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'RED', 'YELLOW', 'GREEN'
    ppe_required TEXT[] NOT NULL,  -- e.g. ARRAY['Nitrile Gloves', 'Eye Protection Shield', 'Fireproof Bin']
    handling_instructions TEXT NOT NULL,
    regulation_reference VARCHAR(120) NOT NULL DEFAULT 'India E-Waste (Management) Rules 2022, Schedule I & II',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Scan Sessions Table
CREATE TABLE IF NOT EXISTS scan_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID NOT NULL REFERENCES hubs(id),
    worker_id UUID NOT NULL REFERENCES hub_workers(id),
    listing_id UUID REFERENCES gadget_listings(id),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS' -- 'IN_PROGRESS', 'COMPLETED', 'ABORTED'
);

-- 15. Scan Items Table
CREATE TABLE IF NOT EXISTS scan_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
    detected_label VARCHAR(80) NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL,
    bbox JSONB NOT NULL, -- { x, y, width, height }
    hazard_level VARCHAR(20) NOT NULL, -- 'RED', 'YELLOW', 'GREEN'
    material_breakdown JSONB NOT NULL,
    is_blocked_for_hazard BOOLEAN NOT NULL DEFAULT FALSE,
    worker_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scan_items_session ON scan_items(session_id);

-- 16. Hazard Alerts Table
CREATE TABLE IF NOT EXISTS hazard_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES scan_sessions(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES scan_items(id) ON DELETE CASCADE,
    hazard_class VARCHAR(50) NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL, -- Raised when >= 0.85
    safety_guideline_id UUID REFERENCES safety_guidelines(id),
    acknowledged_by_worker_id UUID REFERENCES hub_workers(id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hazard_alerts_session ON hazard_alerts(session_id);

-- 17. Fraud Flags Table
CREATE TABLE IF NOT EXISTS fraud_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES gadget_listings(id),
    user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    anomaly_score NUMERIC(4, 3) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'FLAGGED', -- 'FLAGGED', 'UNDER_REVIEW', 'CLEARED', 'CONFIRMED_FRAUD'
    resolved_by_admin_id UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON fraud_flags(status);

-- 18. Audit Log Table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    actor_role VARCHAR(30) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id UUID NOT NULL,
    payload_before JSONB,
    payload_after JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- 19. Impact Metrics Table
CREATE TABLE IF NOT EXISTS impact_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_id UUID REFERENCES hubs(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_ewaste_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    copper_recovered_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    gold_recovered_g NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    palladium_recovered_g NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    lithium_recovered_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    co2_avoided_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    hazard_items_intercepted INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
