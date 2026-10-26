/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserRole, SupportedLanguage, DeviceCategory, HazardClass } from '../constants/index.ts';

export interface User {
  id: string;
  phone_number: string;
  email?: string | null;
  full_name: string;
  role: UserRole;
  mfa_enabled: boolean;
  preferred_language: SupportedLanguage;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  created_at: string;
  updated_at: string;
}

export interface Hub {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  capacity_kg_per_day: number;
  is_active: boolean;
  created_at: string;
}

export interface HubWorker {
  id: string;
  user_id: string;
  hub_id: string;
  badge_number: string;
  certified_for_hazards: boolean;
  is_active: boolean;
  user?: User;
  hub?: Hub;
}

export interface MaterialComposition {
  id: string;
  device_category: DeviceCategory;
  component_name: string;
  weight_kg: number;
  recovery_yield_pct: number;
  primary_material: 'copper' | 'gold' | 'palladium' | 'lithium' | 'aluminum' | 'lead';
  hazard_class: 'SAFE' | 'CAUTION' | 'HAZARDOUS';
}

export type PhysicalCondition = 'LIKE_NEW' | 'WORKING_MINOR_DEFECTS' | 'DEAD_NON_WORKING';
export type ListingStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'SCHEDULED'
  | 'IN_TRANSIT'
  | 'RECEIVED_AT_HUB'
  | 'VERIFIED'
  | 'REJECTED';

export interface GadgetListing {
  id: string;
  user_id: string;
  device_category: DeviceCategory;
  brand: string;
  model: string;
  physical_condition: PhysicalCondition;
  estimated_points: number;
  status: ListingStatus;
  intake_type: 'PICKUP' | 'HUB_DROPOFF';
  hub_id?: string | null;
  scheduled_slot?: string | null;
  tracking_code: string;
  created_at: string;
  updated_at: string;
  photos?: string[];
}

export interface Valuation {
  id: string;
  listing_id: string;
  base_points: number;
  final_verified_points?: number | null;
  commodity_rates_snapshot: Record<string, number>;
  calculation_breakdown: {
    components: Array<{
      component_name: string;
      weight_kg: number;
      recovery_yield_pct: number;
      primary_material: string;
      market_rate_per_kg: number;
      estimated_value_inr: number;
      hazard_class: string;
    }>;
    total_value_inr: number;
    points_multiplier: number;
    final_points: number;
  };
  calculated_at: string;
}

export interface PointsLedgerEntry {
  id: string;
  user_id: string;
  transaction_type: 'CREDIT_VERIFICATION' | 'DEBIT_REDEMPTION' | 'MANUAL_ADJUSTMENT' | 'REVERSAL';
  points: number;
  balance_after: number;
  idempotency_key: string;
  reference_id: string;
  reference_type: 'GADGET_LISTING' | 'REDEMPTION' | 'MANUAL';
  notes?: string | null;
  created_at: string;
}

export interface Voucher {
  id: string;
  provider: 'AMAZON' | 'FLIPKART' | 'CROMA';
  voucher_code_hash: string;
  masked_code: string;
  denomination_inr: number;
  points_cost: number;
  status: 'AVAILABLE' | 'RESERVED' | 'REDEEMED' | 'EXPIRED';
  expires_at: string;
}

export interface SafetyGuideline {
  id: string;
  hazard_class: HazardClass;
  component_name: string;
  severity: 'RED' | 'YELLOW' | 'GREEN';
  ppe_required: string[];
  handling_instructions: string;
  regulation_reference: string;
}

export interface BoundingBox {
  x: number;      // normalized 0..1
  y: number;      // normalized 0..1
  width: number;  // normalized 0..1
  height: number; // normalized 0..1
}

export interface DetectionResult {
  detected_label: string;
  confidence: number;
  bbox: BoundingBox;
  hazard_level: 'RED' | 'YELLOW' | 'GREEN';
  hazard_class?: HazardClass | null;
  material_breakdown: Record<string, number>; // metal -> estimated grams
  is_hazard_alert_triggered: boolean;
  ppe_guidance?: {
    guideline_id: string;
    ppe_required: string[];
    handling_instructions: string;
    regulation_reference: string;
  } | null;
}

export interface ScanSession {
  id: string;
  hub_id: string;
  worker_id: string;
  listing_id?: string | null;
  started_at: string;
  ended_at?: string | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED';
}
