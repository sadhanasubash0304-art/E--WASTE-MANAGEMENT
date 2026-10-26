-- EcoCircuit Database Seed Data 002
-- Realistic reference datasets: Material Composition, Safety Guidelines (India E-Waste 2022),
-- Hubs, Pre-configured Users (bcrypt cost 12 hashes), Voucher Inventory, Sample Metrics

-- 1. Seed Roles
INSERT INTO roles (name, description, permissions) VALUES
('CONSUMER', 'Standard consumer who can list old gadgets, schedule pickups, earn points and redeem vouchers', '["gadget:create", "gadget:read", "points:redeem", "pickup:schedule"]'::jsonb),
('HUB_WORKER', 'Authorized hub personnel who operates the AI camera sorting assistant, logs hazards, and verifies drop-offs', '["scan:execute", "hazard:acknowledge", "gadget:verify", "hub:inventory"]'::jsonb),
('ADMIN', 'Platform administrator with MFA: manages users, fraud queue, voucher pool, and ESG impact compliance', '["admin:all", "fraud:resolve", "voucher:manage", "metrics:export"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 2. Seed Safety Guidelines (India's E-Waste Management Rules 2022, Schedules I & II)
INSERT INTO safety_guidelines (hazard_class, component_name, severity, ppe_required, handling_instructions, regulation_reference) VALUES
('LI_ION_BATTERY', 'Lithium-ion Battery Pack / Pouch Cell', 'RED',
 ARRAY['Nitrile Heat-Resistant Gloves (EN 388)', 'Safety Goggles with Side Shields (ANSI Z87.1)', 'Anti-Static Non-Conductive Tweezers', 'Non-combustible Sand Bucket Nearby'],
 'DANGER: High thermal runaway risk. Do NOT puncture, crush, or expose to heat. Store in dedicated vermiculite-insulated, fireproof containment bins at <= 25°C. Tape exposed terminals immediately.',
 'India E-Waste (Management) Rules 2022 - Schedule I, Part B (Batteries & Accumulators)'),

('CRT_LEAD', 'Cathode Ray Tube (CRT) Funnel & Neck Glass', 'RED',
 ARRAY['Cut-Resistant Kevlar Gloves (Level 5)', 'Full Face Shield', 'FFP3 Dust Respirator (Lead Particulate)', 'Heavy Duty Apron'],
 'DANGER: Contains toxic lead oxide (> 20% by weight) and high implosion hazard under vacuum pressure. De-vacuum gently via neck nipple using certified extraction hood before handling glass cullet.',
 'India E-Waste (Management) Rules 2022 - Schedule II (Reduction of Hazardous Substances - Lead Thresholds)'),

('MERCURY_SWITCH', 'Mercury Tilt Switch / Backlight Cold Cathode Fluorescent Lamp (CCFL)', 'RED',
 ARRAY['Nitrile Chem-Proof Gloves', 'Mercury Vapor Respirator Mask (NIOSH Hg-approved)', 'Chemical Splash Eyewear'],
 'DANGER: Neurotoxic elemental mercury vapor release upon rupture. Handle gently without mechanical crushing. Place unbroken lamps into vapor-tight sealed cylinders for retort recovery.',
 'India E-Waste (Management) Rules 2022 - Rule 4(1) & Schedule II (Mercury ban in electronics)'),

('PCB_CAPACITOR', 'High-Voltage Electrolytic Capacitors & PCB Modules', 'YELLOW',
 ARRAY['Insulated Gloves (1000V rated)', 'Anti-static ESD Wrist Strap', 'Eye Protection Glasses'],
 'CAUTION: Electric shock hazard and chemical electrolyte leakage. Discharge capacitor terminals with 10kOhm resistor before touching or desoldering. Check for bulging or leaked boric acid.',
 'India E-Waste (Management) Rules 2022 - Safe Dismantling Standards for Printed Circuit Boards'),

('TONER_POWDER', 'Laser Printer Toner Cartridge & Fine Dust Residue', 'YELLOW',
 ARRAY['N95 Particulate Respirator', 'Latex/Nitrile Disposable Gloves', 'Protective Lab Coat'],
 'CAUTION: Combustible dust explosion hazard and respiratory irritant (carbon black, polymer resin). Do NOT use standard vacuum cleaners. Use certified HEPA/ESD e-waste vacuums only.',
 'India E-Waste (Management) Rules 2022 - Toner & Consumable Disposal Guidelines')
ON CONFLICT (hazard_class) DO UPDATE SET
  ppe_required = EXCLUDED.ppe_required,
  handling_instructions = EXCLUDED.handling_instructions;

-- 3. Seed Material Composition (Realistic weights, recovery yields, and base metals)
INSERT INTO material_composition (device_category, component_name, weight_kg, recovery_yield_pct, primary_material, hazard_class) VALUES
-- Smartphone (~0.180 kg total)
('smartphone', 'High-Grade Smartphone Motherboard (PCB)', 0.0280, 92.50, 'gold', 'SAFE'),
('smartphone', 'Smartphone Copper Shielding & Antennas', 0.0160, 95.00, 'copper', 'SAFE'),
('smartphone', 'Lithium-Cobalt Battery Cell', 0.0450, 78.00, 'lithium', 'HAZARDOUS'),
('smartphone', 'Aluminum Alloy Frame & Bracket', 0.0420, 98.00, 'aluminum', 'SAFE'),
('smartphone', 'OLED / Glass Display Assembly', 0.0400, 60.00, 'palladium', 'SAFE'),

-- Laptop (~2.100 kg total)
('laptop', 'Multi-Layer Laptop Motherboard & RAM', 0.1600, 91.00, 'gold', 'SAFE'),
('laptop', 'Pure Copper Heat Pipes & Thermal Fin Stack', 0.0950, 96.50, 'copper', 'SAFE'),
('laptop', '6-Cell Lithium-Ion Battery Module', 0.3200, 75.00, 'lithium', 'HAZARDOUS'),
('laptop', 'Magnesium-Aluminum Chassis', 0.6500, 97.00, 'aluminum', 'SAFE'),
('laptop', 'High-Density Ferrite Capacitors & Inductors', 0.0800, 85.00, 'palladium', 'CAUTION'),

-- CRT Monitor (~14.50 kg total)
('crt_monitor', 'CRT Leaded Funnel Glass', 6.2000, 80.00, 'lead', 'HAZARDOUS'),
('crt_monitor', 'Copper Deflection Yoke Coils', 0.8500, 97.00, 'copper', 'SAFE'),
('crt_monitor', 'Single-Sided FR2 Power Supply Board', 0.6500, 70.00, 'copper', 'CAUTION'),
('crt_monitor', 'High-Voltage Flyback Transformer', 0.4500, 85.00, 'copper', 'CAUTION'),

-- Tablet (~0.450 kg total)
('tablet', 'Logic Board with Integrated Storage', 0.0380, 93.00, 'gold', 'SAFE'),
('tablet', 'Lithium Polymer Pouch Battery', 0.1100, 76.00, 'lithium', 'HAZARDOUS'),
('tablet', 'Anodized Aluminum Backplate', 0.1800, 98.00, 'aluminum', 'SAFE'),
('tablet', 'Copper Foil Heat Spreader', 0.0220, 96.00, 'copper', 'SAFE'),

-- Desktop PC (~8.50 kg total)
('desktop_pc', 'ATX Motherboard & Add-in PCIe Cards', 0.4500, 90.00, 'gold', 'SAFE'),
('desktop_pc', 'Power Supply Unit (PSU) Transformers & Coils', 0.5800, 94.00, 'copper', 'CAUTION'),
('desktop_pc', 'Steel & Aluminum Tower Casing', 4.5000, 99.00, 'aluminum', 'SAFE'),
('desktop_pc', 'Solid Electrolytic Capacitors & Chokes', 0.1200, 84.00, 'palladium', 'CAUTION')
ON CONFLICT DO NOTHING;

-- 4. Seed Hubs
INSERT INTO hubs (code, name, address, city, state, pincode, lat, lng, capacity_kg_per_day, is_active) VALUES
('HUB-BLR-01', 'EcoCircuit Central Hub Bengaluru', 'Plot 42, Electronic City Phase 1, Hosur Road', 'Bengaluru', 'Karnataka', '560100', 12.845214, 77.660168, 5000.00, true),
('HUB-MAA-01', 'EcoCircuit Guindy Sorting Facility', 'No. 18, SIDCO Industrial Estate, Guindy', 'Chennai', 'Tamil Nadu', '600032', 13.006662, 80.203613, 3500.00, true),
('HUB-BOM-01', 'EcoCircuit Andheri Recovery Terminal', 'Unit 7, MIDC Central Road, Andheri East', 'Mumbai', 'Maharashtra', '400093', 19.117281, 72.868782, 4000.00, true),
('HUB-DEL-01', 'EcoCircuit Okhla Circular Node', 'Phase III, Okhla Industrial Area', 'New Delhi', 'Delhi', '110020', 28.535517, 77.273674, 4500.00, true)
ON CONFLICT (code) DO NOTHING;

-- 5. Seed Users (Bcrypt hash for 'EcoPass123!#' with cost 12: $2b$12$e6x55d5bK7qj8vLqVn07re5y5V6Uf4e9z0L7.J8t0o6N.r2F8xHGe)
INSERT INTO users (id, phone_number, email, full_name, role, password_hash, preferred_language, status) VALUES
('a0000000-0000-0000-0000-000000000001', '+919876543210', 'consumer@ecocircuit.org', 'Arun Kumar', 'CONSUMER', '$2b$12$e6x55d5bK7qj8vLqVn07re5y5V6Uf4e9z0L7.J8t0o6N.r2F8xHGe', 'en', 'ACTIVE'),
('a0000000-0000-0000-0000-000000000002', '+919876543211', 'selvi@ecocircuit.org', 'Selvi Meenakshi', 'CONSUMER', '$2b$12$e6x55d5bK7qj8vLqVn07re5y5V6Uf4e9z0L7.J8t0o6N.r2F8xHGe', 'ta', 'ACTIVE'),
('a0000000-0000-0000-0000-000000000003', '+919876543212', 'rajesh@ecocircuit.org', 'Rajesh Sharma', 'CONSUMER', '$2b$12$e6x55d5bK7qj8vLqVn07re5y5V6Uf4e9z0L7.J8t0o6N.r2F8xHGe', 'hi', 'ACTIVE'),
('b0000000-0000-0000-0000-000000000001', '+919876543220', 'worker.blr@ecocircuit.org', 'Karthik Raman (Lead Sorter)', 'HUB_WORKER', '$2b$12$e6x55d5bK7qj8vLqVn07re5y5V6Uf4e9z0L7.J8t0o6N.r2F8xHGe', 'en', 'ACTIVE'),
('c0000000-0000-0000-0000-000000000001', '+919876543230', 'admin@ecocircuit.org', 'Dr. Priya Sundaram', 'ADMIN', '$2b$12$e6x55d5bK7qj8vLqVn07re5y5V6Uf4e9z0L7.J8t0o6N.r2F8xHGe', 'en', 'ACTIVE')
ON CONFLICT (phone_number) DO NOTHING;

-- Set Admin MFA Secret (Base32 format for standard TOTP apps like Google Authenticator)
UPDATE users SET mfa_secret = 'JBSWY3DPEHPK3PXP', mfa_enabled = true WHERE email = 'admin@ecocircuit.org';

-- 6. Link Hub Worker
INSERT INTO hub_workers (user_id, hub_id, badge_number, certified_for_hazards, is_active)
SELECT u.id, h.id, 'BLR-SRT-042', true, true
FROM users u, hubs h
WHERE u.email = 'worker.blr@ecocircuit.org' AND h.code = 'HUB-BLR-01'
ON CONFLICT (badge_number) DO NOTHING;

-- 7. Seed Voucher Inventory (MOCK Amazon & Flipkart vouchers, min 500 points)
INSERT INTO voucher_inventory (provider, voucher_code_hash, voucher_code_encrypted, masked_code, denomination_inr, points_cost, status, expires_at) VALUES
('AMAZON', 'hash_amzn_500_001', 'ENC_AMZN-VOUCH-500-A1B2', 'AMZN-****-A1B2', 250.00, 500, 'AVAILABLE', NOW() + INTERVAL '90 days'),
('AMAZON', 'hash_amzn_1000_001', 'ENC_AMZN-VOUCH-1000-C3D4', 'AMZN-****-C3D4', 500.00, 1000, 'AVAILABLE', NOW() + INTERVAL '90 days'),
('FLIPKART', 'hash_flpk_500_001', 'ENC_FLPK-VOUCH-500-E5F6', 'FLPK-****-E5F6', 250.00, 500, 'AVAILABLE', NOW() + INTERVAL '90 days'),
('FLIPKART', 'hash_flpk_1000_001', 'ENC_FLPK-VOUCH-1000-G7H8', 'FLPK-****-G7H8', 500.00, 1000, 'AVAILABLE', NOW() + INTERVAL '90 days'),
('CROMA', 'hash_crma_2500_001', 'ENC_CRMA-VOUCH-2500-J9K0', 'CRMA-****-J9K0', 1250.00, 2500, 'AVAILABLE', NOW() + INTERVAL '90 days')
ON CONFLICT (voucher_code_hash) DO NOTHING;

-- 8. Seed Initial ESG Impact Metrics
INSERT INTO impact_metrics (hub_id, period_start, period_end, total_ewaste_kg, copper_recovered_kg, gold_recovered_g, palladium_recovered_g, lithium_recovered_kg, co2_avoided_kg, hazard_items_intercepted)
SELECT id, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 4820.50, 485.20, 112.40, 34.60, 185.00, 14250.00, 94
FROM hubs WHERE code = 'HUB-BLR-01'
ON CONFLICT DO NOTHING;
