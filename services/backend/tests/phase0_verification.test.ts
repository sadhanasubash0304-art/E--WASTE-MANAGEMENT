/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RequestOtpSchema,
  VerifyOtpSchema,
  CreateListingSchema,
  RedeemVoucherSchema,
  AcknowledgeHazardSchema,
  HAZARD_CONFIDENCE_THRESHOLD,
  MIN_REDEMPTION_POINTS,
  SUPPORTED_LANGUAGES,
  USER_ROLES,
} from '../../../packages/common/src/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REQUIRED_TABLES = [
  'roles',
  'users',
  'hubs',
  'hub_workers',
  'material_composition',
  'gadget_listings',
  'listing_photos',
  'valuations',
  'pickups_dropoffs',
  'points_ledger',
  'voucher_inventory',
  'redemptions',
  'safety_guidelines',
  'scan_sessions',
  'scan_items',
  'hazard_alerts',
  'fraud_flags',
  'audit_log',
  'impact_metrics',
];

export function runPhase0Verification(): boolean {
  console.log('====================================================');
  console.log('🧪 RUNNING PHASE 0 VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = true;

  // 1. Check Migration SQL & 19 Tables
  const migrationPath = path.resolve(__dirname, '../src/db/migrations/001_initial_schema.sql');
  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file missing at:', migrationPath);
    return false;
  }
  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  console.log('✅ Found 001_initial_schema.sql');

  for (const table of REQUIRED_TABLES) {
    const tableRegex = new RegExp(`CREATE TABLE (IF NOT EXISTS )?${table}\\b`, 'i');
    if (!tableRegex.test(migrationSql)) {
      console.error(`❌ Missing table in migration: ${table}`);
      passed = false;
    } else {
      console.log(`  ✓ Table defined: ${table}`);
    }
  }

  // 2. Check Seed SQL integrity
  const seedPath = path.resolve(__dirname, '../src/db/seeds/002_seed_data.sql');
  if (!fs.existsSync(seedPath)) {
    console.error('❌ Seed file missing at:', seedPath);
    return false;
  }
  const seedSql = fs.readFileSync(seedPath, 'utf8');
  console.log('\n✅ Found 002_seed_data.sql');

  const requiredSeeds = [
    'CONSUMER',
    'HUB_WORKER',
    'ADMIN',
    'LI_ION_BATTERY',
    'CRT_LEAD',
    'MERCURY_SWITCH',
    'PCB_CAPACITOR',
    'TONER_POWDER',
    'India E-Waste (Management) Rules 2022',
    'HUB-BLR-01',
    'HUB-MAA-01',
    'AMAZON',
    'FLIPKART',
  ];

  for (const term of requiredSeeds) {
    if (!seedSql.includes(term)) {
      console.error(`❌ Missing seed term: ${term}`);
      passed = false;
    } else {
      console.log(`  ✓ Seed contains: ${term}`);
    }
  }

  // 3. Test Common Validation Schemas (Zod)
  console.log('\n✅ Verifying Zod Validation Schemas');

  // Test OTP
  const validPhone = RequestOtpSchema.safeParse({ phoneNumber: '+919876543210' });
  const invalidPhone = RequestOtpSchema.safeParse({ phoneNumber: '123' });
  if (validPhone.success && !invalidPhone.success) {
    console.log('  ✓ RequestOtpSchema validation passed');
  } else {
    console.error('❌ RequestOtpSchema validation failed');
    passed = false;
  }

  // Test Hazard Acknowledgment barrier
  const validAck = AcknowledgeHazardSchema.safeParse({
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    itemId: '550e8400-e29b-41d4-a716-446655440001',
    hazardClass: 'LI_ION_BATTERY',
    workerId: '550e8400-e29b-41d4-a716-446655440002',
    acknowledgedPpe: true,
  });
  const invalidAck = AcknowledgeHazardSchema.safeParse({
    sessionId: '550e8400-e29b-41d4-a716-446655440000',
    itemId: '550e8400-e29b-41d4-a716-446655440001',
    hazardClass: 'LI_ION_BATTERY',
    workerId: '550e8400-e29b-41d4-a716-446655440002',
    acknowledgedPpe: false, // Must be true to pass PPE barrier!
  });

  if (validAck.success && !invalidAck.success) {
    console.log('  ✓ AcknowledgeHazardSchema strict PPE interlock enforcement passed');
  } else {
    console.error('❌ AcknowledgeHazardSchema PPE barrier failed');
    passed = false;
  }

  // 4. Validate Configuration Files
  console.log('\n✅ Verifying Core Monorepo Configurations');
  const requiredFiles = [
    'docker-compose.yml',
    '.github/workflows/ci.yml',
    'DECISIONS.md',
    'README.md',
    'packages/common/src/index.ts',
  ];

  for (const relPath of requiredFiles) {
    const fullPath = path.resolve(__dirname, '../../../', relPath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Missing file: ${relPath}`);
      passed = false;
    } else {
      console.log(`  ✓ Confirmed file: ${relPath}`);
    }
  }

  // 5. Verify Thresholds
  if (HAZARD_CONFIDENCE_THRESHOLD === 0.85 && MIN_REDEMPTION_POINTS === 500) {
    console.log('  ✓ Validated HAZARD_CONFIDENCE_THRESHOLD (0.85) and MIN_REDEMPTION_POINTS (500)');
  } else {
    console.error('❌ Constants threshold mismatch');
    passed = false;
  }

  console.log('\n====================================================');
  if (passed) {
    console.log('🎉 PHASE 0 VERIFICATION PASSED: ALL CHECKS SUCCESSFUL');
  } else {
    console.log('❌ PHASE 0 VERIFICATION FAILED');
  }
  console.log('====================================================\n');

  return passed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const success = runPhase0Verification();
  if (!success) {
    process.exit(1);
  }
}
