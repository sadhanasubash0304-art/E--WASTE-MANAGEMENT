/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'CONSUMER' | 'HUB_WORKER' | 'ADMIN';
export type SupportedLanguage = 'en' | 'ta' | 'hi';
export type DeviceCategory = 'smartphone' | 'laptop' | 'crt_monitor' | 'tablet' | 'desktop_pc';
export type PhysicalCondition = 'LIKE_NEW' | 'WORKING_MINOR_DEFECTS' | 'DEAD_NON_WORKING';
export type ListingStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'SCHEDULED' 
  | 'IN_TRANSIT' 
  | 'RECEIVED_AT_HUB' 
  | 'VERIFIED' 
  | 'REJECTED';

export type IntakeType = 'PICKUP' | 'HUB_DROPOFF';
export type HazardSeverity = 'RED' | 'YELLOW' | 'GREEN';
export type HazardClass = 
  | 'LI_ION_BATTERY' 
  | 'CRT_LEAD' 
  | 'MERCURY_SWITCH' 
  | 'PCB_CAPACITOR' 
  | 'TONER_POWDER';

export interface User {
  id: string;
  phone_number: string;
  email: string;
  full_name: string;
  role: UserRole;
  mfa_enabled: boolean;
  preferred_language: SupportedLanguage;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
}

export interface Hub {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  capacity_kg_per_day: number;
  is_active: boolean;
}

export interface MaterialComponent {
  component_name: string;
  weight_kg: number;
  recovery_yield_pct: number;
  primary_material: 'copper' | 'gold' | 'palladium' | 'lithium' | 'aluminum' | 'lead';
  hazard_class: 'SAFE' | 'CAUTION' | 'HAZARDOUS';
}

export interface CommodityPrices {
  copper: number;     // INR/kg
  gold: number;       // INR/kg
  palladium: number;  // INR/kg
  lithium: number;    // INR/kg
  aluminum: number;   // INR/kg
  lead: number;       // INR/kg
  lastUpdated: string;
  isMock: boolean;
}

export interface ComponentBreakdownItem {
  component_name: string;
  weight_kg: number;
  recovery_yield_pct: number;
  primary_material: string;
  market_rate_per_kg: number;
  recovered_weight_grams: number;
  estimated_value_inr: number;
  hazard_class: string;
}

export interface ValuationBreakdown {
  components: ComponentBreakdownItem[];
  total_value_inr: number;
  points_multiplier: number;
  estimated_points: number;
}

export interface GadgetListing {
  id: string;
  user_id: string;
  device_category: DeviceCategory;
  brand: string;
  model: string;
  physical_condition: PhysicalCondition;
  estimated_points: number;
  final_points?: number;
  status: ListingStatus;
  intake_type: IntakeType;
  hub_id?: string;
  pickup_address?: string;
  scheduled_slot?: string;
  tracking_code: string;
  photos: string[];
  valuation: ValuationBreakdown;
  created_at: string;
  verified_at?: string;
  rejection_reason?: string;
  fraud_score?: number;
}

export interface PointsLedgerEntry {
  id: string;
  user_id: string;
  transaction_type: 'CREDIT_VERIFICATION' | 'DEBIT_REDEMPTION' | 'MANUAL_ADJUSTMENT';
  points: number;
  balance_after: number;
  idempotency_key: string;
  reference_id: string;
  reference_type: 'GADGET_LISTING' | 'REDEMPTION' | 'ADJUSTMENT';
  notes: string;
  created_at: string;
}

export interface Voucher {
  id: string;
  provider: 'AMAZON' | 'FLIPKART' | 'CROMA';
  masked_code: string;
  code?: string;
  denomination_inr: number;
  points_cost: number;
  status: 'AVAILABLE' | 'REDEEMED';
  expires_at: string;
}

export interface RedemptionRecord {
  id: string;
  user_id: string;
  voucher_id: string;
  provider: 'AMAZON' | 'FLIPKART' | 'CROMA';
  denomination_inr: number;
  points_debited: number;
  voucher_code: string;
  idempotency_key: string;
  redeemed_at: string;
}

export interface SafetyGuideline {
  hazard_class: HazardClass;
  component_name: string;
  severity: HazardSeverity;
  ppe_required: string[];
  handling_instructions: string;
  regulation_reference: string;
}

export interface BoundingBox {
  x: number;      // 0..1
  y: number;      // 0..1
  width: number;  // 0..1
  height: number; // 0..1
}

export interface DetectedEwasteItem {
  id: string;
  label: string;
  confidence: number;
  bbox: BoundingBox;
  hazard_level: HazardSeverity;
  hazard_class?: HazardClass;
  material_breakdown: Record<string, string>;
  is_hazard_alert: boolean;
  ppe_guidance?: SafetyGuideline;
}

export interface HazardAlertEvent {
  id: string;
  sessionId: string;
  itemId: string;
  hazardClass: HazardClass;
  confidence: number;
  timestamp: string;
  workerId: string;
  hubId: string;
  guideline: SafetyGuideline;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface FraudFlag {
  id: string;
  listing_id: string;
  user_id: string;
  user_name: string;
  device: string;
  reason: string;
  anomaly_score: number;
  status: 'FLAGGED' | 'UNDER_REVIEW' | 'CLEARED' | 'CONFIRMED_FRAUD';
  created_at: string;
}

export interface ESGImpactReport {
  period: string;
  total_ewaste_diverted_kg: number;
  copper_recovered_kg: number;
  gold_recovered_grams: number;
  palladium_recovered_grams: number;
  lithium_recovered_kg: number;
  aluminum_recovered_kg: number;
  co2_emissions_avoided_kg: number;
  hazardous_components_intercepted: number;
  active_hubs_count: number;
  participating_consumers_count: number;
}
