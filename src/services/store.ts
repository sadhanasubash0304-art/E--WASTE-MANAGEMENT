/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Hub,
  GadgetListing,
  PointsLedgerEntry,
  Voucher,
  RedemptionRecord,
  SafetyGuideline,
  FraudFlag,
  ESGImpactReport,
  CommodityPrices,
  DeviceCategory,
  PhysicalCondition,
  IntakeType,
  ValuationBreakdown,
  MaterialComponent,
  DetectedEwasteItem,
  HazardAlertEvent,
} from '../types/index.ts';

// 1. Material Composition Lookup Table (Device Category -> Components -> Weight & Recovery Yield)
export const MATERIAL_COMPOSITIONS: Record<DeviceCategory, MaterialComponent[]> = {
  smartphone: [
    { component_name: 'High-Density Logic Board (PCB)', weight_kg: 0.028, recovery_yield_pct: 92.5, primary_material: 'gold', hazard_class: 'SAFE' },
    { component_name: 'Antenna & Shielding Foil', weight_kg: 0.016, recovery_yield_pct: 95.0, primary_material: 'copper', hazard_class: 'SAFE' },
    { component_name: 'Lithium-Cobalt Battery Cell', weight_kg: 0.045, recovery_yield_pct: 78.0, primary_material: 'lithium', hazard_class: 'HAZARDOUS' },
    { component_name: 'Extruded Aluminum Frame', weight_kg: 0.042, recovery_yield_pct: 98.0, primary_material: 'aluminum', hazard_class: 'SAFE' },
    { component_name: 'Capacitors & Connectors', weight_kg: 0.008, recovery_yield_pct: 88.0, primary_material: 'palladium', hazard_class: 'SAFE' },
  ],
  laptop: [
    { component_name: 'Multi-Layer Laptop Motherboard', weight_kg: 0.160, recovery_yield_pct: 91.0, primary_material: 'gold', hazard_class: 'SAFE' },
    { component_name: 'Copper Heatpipe & Cooler Block', weight_kg: 0.095, recovery_yield_pct: 96.5, primary_material: 'copper', hazard_class: 'SAFE' },
    { component_name: '6-Cell Lithium-Ion Battery Module', weight_kg: 0.320, recovery_yield_pct: 75.0, primary_material: 'lithium', hazard_class: 'HAZARDOUS' },
    { component_name: 'Magnesium-Aluminum Enclosure', weight_kg: 0.650, recovery_yield_pct: 97.0, primary_material: 'aluminum', hazard_class: 'SAFE' },
    { component_name: 'Ceramic Capacitors & Solder Nodes', weight_kg: 0.025, recovery_yield_pct: 85.0, primary_material: 'palladium', hazard_class: 'CAUTION' },
  ],
  crt_monitor: [
    { component_name: 'CRT Leaded Funnel Glass', weight_kg: 6.200, recovery_yield_pct: 80.0, primary_material: 'lead', hazard_class: 'HAZARDOUS' },
    { component_name: 'Deflection Yoke Copper Winding', weight_kg: 0.850, recovery_yield_pct: 97.0, primary_material: 'copper', hazard_class: 'SAFE' },
    { component_name: 'High Voltage Flyback Transformer', weight_kg: 0.450, recovery_yield_pct: 85.0, primary_material: 'copper', hazard_class: 'CAUTION' },
    { component_name: 'Electrolytic Filter Capacitors', weight_kg: 0.120, recovery_yield_pct: 80.0, primary_material: 'aluminum', hazard_class: 'CAUTION' },
  ],
  tablet: [
    { component_name: 'Embedded Logic PCB Assembly', weight_kg: 0.038, recovery_yield_pct: 93.0, primary_material: 'gold', hazard_class: 'SAFE' },
    { component_name: 'High-Capacity Li-Po Pouch Cell', weight_kg: 0.110, recovery_yield_pct: 76.0, primary_material: 'lithium', hazard_class: 'HAZARDOUS' },
    { component_name: 'Anodized Aluminum Casing', weight_kg: 0.180, recovery_yield_pct: 98.0, primary_material: 'aluminum', hazard_class: 'SAFE' },
    { component_name: 'Copper Grounding Plates', weight_kg: 0.022, recovery_yield_pct: 96.0, primary_material: 'copper', hazard_class: 'SAFE' },
  ],
  desktop_pc: [
    { component_name: 'ATX Mainboard & Expansion Cards', weight_kg: 0.450, recovery_yield_pct: 90.0, primary_material: 'gold', hazard_class: 'SAFE' },
    { component_name: 'Power Supply Unit Copper Coils', weight_kg: 0.580, recovery_yield_pct: 94.0, primary_material: 'copper', hazard_class: 'CAUTION' },
    { component_name: 'Chassis Galvanized Steel & Aluminum', weight_kg: 4.500, recovery_yield_pct: 99.0, primary_material: 'aluminum', hazard_class: 'SAFE' },
    { component_name: 'Palladium-Rich Contact Fingers', weight_kg: 0.030, recovery_yield_pct: 86.0, primary_material: 'palladium', hazard_class: 'CAUTION' },
  ],
};

// 2. Safety Guidelines Table (India's E-Waste Management Rules 2022)
export const SAFETY_GUIDELINES: Record<string, SafetyGuideline> = {
  LI_ION_BATTERY: {
    hazard_class: 'LI_ION_BATTERY',
    component_name: 'Lithium-Ion / Li-Po Battery Pack',
    severity: 'RED',
    ppe_required: [
      'Nitrile Heat-Resistant Gloves (EN 388)',
      'Side-Shield Safety Goggles (ANSI Z87.1)',
      'Anti-Static Ceramic Tweezers',
      'Vermiculite / Sand Emergency Bucket Nearby',
    ],
    handling_instructions: 'CRITICAL: Severe thermal runaway & explosive venting risk. Do not puncture or bend cell. Keep below 25°C in vermiculite fireproof container. Insulate terminals immediately.',
    regulation_reference: 'India E-Waste (Management) Rules 2022 - Schedule I, Part B (Batteries & Accumulators)',
  },
  CRT_LEAD: {
    hazard_class: 'CRT_LEAD',
    component_name: 'Cathode Ray Tube (CRT) Leaded Glass',
    severity: 'RED',
    ppe_required: [
      'Cut-Resistant Level 5 Kevlar Gloves',
      'Full-Face Polycarbonate Shield',
      'FFP3 / N99 Particulate Respirator',
      'Heavy Leather Safety Apron',
    ],
    handling_instructions: 'CRITICAL: Contains > 20% toxic lead oxide. Implosion danger under high vacuum. Relieve vacuum via electron-gun exhaust stem inside certified extraction hood prior to glass segregation.',
    regulation_reference: 'India E-Waste (Management) Rules 2022 - Schedule II (Reduction of Hazardous Substances - Lead)',
  },
  MERCURY_SWITCH: {
    hazard_class: 'MERCURY_SWITCH',
    component_name: 'Mercury Tilt Switch / CCFL Backlight Bulb',
    severity: 'RED',
    ppe_required: [
      'Heavy Nitrile Chemical Gloves',
      'Mercury-Vapor Approved Respirator Cartridge',
      'Anti-Splash Sealed Goggles',
    ],
    handling_instructions: 'CRITICAL: Acute neurotoxin. Do not crush CCFL tube. Immediately place intact lamps into hermetically sealed containers for specialized thermal retort recycling.',
    regulation_reference: 'India E-Waste (Management) Rules 2022 - Rule 4(1) & Schedule II (Strict Mercury Protocol)',
  },
  PCB_CAPACITOR: {
    hazard_class: 'PCB_CAPACITOR',
    component_name: 'High-Voltage Electrolytic Capacitors',
    severity: 'YELLOW',
    ppe_required: [
      '1000V Rated Insulating Gloves',
      'Anti-Static ESD Grounding Strap',
      'Impact Safety Glasses',
    ],
    handling_instructions: 'CAUTION: Stored electrical charge and corrosive electrolyte. Discharge all terminals with a 10 kΩ resistor before handling. Inspect for fluid leaks.',
    regulation_reference: 'India E-Waste (Management) Rules 2022 - Dismantling Safety Standards for PCBs',
  },
  TONER_POWDER: {
    hazard_class: 'TONER_POWDER',
    component_name: 'Laser Toner Cartridge & Polymer Dust',
    severity: 'YELLOW',
    ppe_required: [
      'N95 Particulate Mask',
      'Nitrile Disposable Gloves',
      'Protective Lab Coat / Smock',
    ],
    handling_instructions: 'CAUTION: Respirable fine carbon dust and explosion hazard in air. Do NOT use domestic vacuum cleaners. Use specialized ESD-safe HEPA filter vacuum only.',
    regulation_reference: 'India E-Waste (Management) Rules 2022 - Consumable Safe Disposal Norms',
  },
};

// 3. Commodity Prices Feed (MOCK adapter with caching)
export class CommodityPriceService {
  private static cachedRates: CommodityPrices = {
    copper: 865,        // INR/kg
    gold: 6250000,      // INR/kg (~6250 INR/gram)
    palladium: 3120000, // INR/kg (~3120 INR/gram)
    lithium: 1850,      // INR/kg
    aluminum: 245,      // INR/kg
    lead: 180,          // INR/kg
    lastUpdated: new Date().toISOString(),
    isMock: true,
  };

  static getLiveRates(): CommodityPrices {
    // Return cached rates, simulating real-time market drift
    return { ...this.cachedRates };
  }

  static updateRates(newRates: Partial<CommodityPrices>) {
    this.cachedRates = {
      ...this.cachedRates,
      ...newRates,
      lastUpdated: new Date().toISOString(),
    };
  }
}

// 4. Valuation Engine: Calculates Green Points
export function calculateGadgetValuation(
  category: DeviceCategory,
  condition: PhysicalCondition
): ValuationBreakdown {
  const rates = CommodityPriceService.getLiveRates();
  const components = MATERIAL_COMPOSITIONS[category] || MATERIAL_COMPOSITIONS.smartphone;

  // Condition multiplier: Like new = 1.0, Working defects = 0.85, Dead = 0.65
  const conditionFactor =
    condition === 'LIKE_NEW' ? 1.0 : condition === 'WORKING_MINOR_DEFECTS' ? 0.85 : 0.65;

  let totalValueInr = 0;

  const breakdown: ValuationBreakdown['components'] = components.map((comp) => {
    const marketRate = (rates as unknown as Record<string, number>)[comp.primary_material] || 250;
    // Component metal value = weight_kg * (yield_pct / 100) * market_rate
    const recoveredKg = comp.weight_kg * (comp.recovery_yield_pct / 100);
    const recoveredGrams = recoveredKg * 1000;
    const valueInr = recoveredKg * marketRate * conditionFactor;
    totalValueInr += valueInr;

    return {
      component_name: comp.component_name,
      weight_kg: comp.weight_kg,
      recovery_yield_pct: comp.recovery_yield_pct,
      primary_material: comp.primary_material,
      market_rate_per_kg: marketRate,
      recovered_weight_grams: Number(recoveredGrams.toFixed(2)),
      estimated_value_inr: Number(valueInr.toFixed(2)),
      hazard_class: comp.hazard_class,
    };
  });

  // Points conversion: 1 INR of recovered metal value = 10 Green Points
  const pointsMultiplier = 10;
  const estimatedPoints = Math.round(totalValueInr * pointsMultiplier);

  return {
    components: breakdown,
    total_value_inr: Number(totalValueInr.toFixed(2)),
    points_multiplier: pointsMultiplier,
    estimated_points: estimatedPoints,
  };
}

// 5. Sound Synthesizer via Web Audio API (No external sound files required)
export class SoundEffects {
  private static ctx: AudioContext | null = null;

  private static getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Hazard Alert Siren (Two-tone high-low alarm)
  static playHazardAlarm() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      // High pitch then low pitch alarm sound
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(659, now + 0.15);
      osc.frequency.setValueAtTime(880, now + 0.3);
      osc.frequency.setValueAtTime(659, now + 0.45);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.7);
    } catch {
      // Audio might be blocked by browser autoplay policy before user gesture
    }
  }

  // Success Chime
  static playSuccessChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.5, now + 0.3); // C6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch {
      // Audio context catch
    }
  }
}

// 6. Cryptographically Secure Single-Use Voucher Generator
export function generateVoucherCode(provider: 'AMAZON' | 'FLIPKART' | 'CROMA'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous characters like O, 0, 1, I
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  let segment = '';
  for (let i = 0; i < 8; i++) {
    segment += chars[randomBytes[i] % chars.length];
  }
  const prefix = provider === 'AMAZON' ? 'AMZN' : provider === 'FLIPKART' ? 'FLPK' : 'CRMA';
  return `${prefix}-${segment.slice(0, 4)}-${segment.slice(4, 8)}`;
}

// 7. Seed Initial State
export const INITIAL_HUBS: Hub[] = [
  {
    id: 'hub-blr-01',
    code: 'HUB-BLR-01',
    name: 'EcoCircuit Central Hub Bengaluru',
    address: 'Plot 42, Electronic City Phase 1, Hosur Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560100',
    lat: 12.845214,
    lng: 77.660168,
    capacity_kg_per_day: 5000,
    is_active: true,
  },
  {
    id: 'hub-maa-01',
    code: 'HUB-MAA-01',
    name: 'EcoCircuit Guindy Sorting Facility',
    address: 'No. 18, SIDCO Industrial Estate, Guindy',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600032',
    lat: 13.006662,
    lng: 80.203613,
    capacity_kg_per_day: 3500,
    is_active: true,
  },
  {
    id: 'hub-bom-01',
    code: 'HUB-BOM-01',
    name: 'EcoCircuit Andheri Recovery Terminal',
    address: 'Unit 7, MIDC Central Road, Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400093',
    lat: 19.117281,
    lng: 72.868782,
    capacity_kg_per_day: 4000,
    is_active: true,
  },
  {
    id: 'hub-del-01',
    code: 'HUB-DEL-01',
    name: 'EcoCircuit Okhla Circular Node',
    address: 'Phase III, Okhla Industrial Area',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110020',
    lat: 28.535517,
    lng: 77.273674,
    capacity_kg_per_day: 4500,
    is_active: true,
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-consumer-01',
    phone_number: '+919876543210',
    email: 'consumer@ecocircuit.org',
    full_name: 'Arun Kumar',
    role: 'CONSUMER',
    mfa_enabled: false,
    preferred_language: 'en',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'usr-consumer-02',
    phone_number: '+919876543211',
    email: 'selvi@ecocircuit.org',
    full_name: 'Selvi Meenakshi',
    role: 'CONSUMER',
    mfa_enabled: false,
    preferred_language: 'ta',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'usr-consumer-03',
    phone_number: '+919876543212',
    email: 'rajesh@ecocircuit.org',
    full_name: 'Rajesh Sharma',
    role: 'CONSUMER',
    mfa_enabled: false,
    preferred_language: 'hi',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'usr-worker-01',
    phone_number: '+919876543220',
    email: 'worker.blr@ecocircuit.org',
    full_name: 'Karthik Raman (Inspector)',
    role: 'HUB_WORKER',
    mfa_enabled: false,
    preferred_language: 'en',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: 'usr-admin-01',
    phone_number: '+919876543230',
    email: 'admin@ecocircuit.org',
    full_name: 'Dr. Priya Sundaram',
    role: 'ADMIN',
    mfa_enabled: true,
    preferred_language: 'en',
    status: 'ACTIVE',
    created_at: new Date(Date.now() - 86400000 * 120).toISOString(),
  },
];

export const INITIAL_VOUCHERS: Voucher[] = [
  {
    id: 'vouch-amzn-500',
    provider: 'AMAZON',
    masked_code: 'AMZN-****-A1B2',
    denomination_inr: 250,
    points_cost: 500,
    status: 'AVAILABLE',
    expires_at: '2026-12-31',
  },
  {
    id: 'vouch-amzn-1000',
    provider: 'AMAZON',
    masked_code: 'AMZN-****-C3D4',
    denomination_inr: 500,
    points_cost: 1000,
    status: 'AVAILABLE',
    expires_at: '2026-12-31',
  },
  {
    id: 'vouch-flpk-500',
    provider: 'FLIPKART',
    masked_code: 'FLPK-****-E5F6',
    denomination_inr: 250,
    points_cost: 500,
    status: 'AVAILABLE',
    expires_at: '2026-12-31',
  },
  {
    id: 'vouch-flpk-1000',
    provider: 'FLIPKART',
    masked_code: 'FLPK-****-G7H8',
    denomination_inr: 500,
    points_cost: 1000,
    status: 'AVAILABLE',
    expires_at: '2026-12-31',
  },
  {
    id: 'vouch-crma-2500',
    provider: 'CROMA',
    masked_code: 'CRMA-****-J9K0',
    denomination_inr: 1250,
    points_cost: 2500,
    status: 'AVAILABLE',
    expires_at: '2026-12-31',
  },
];

export const INITIAL_LEDGER: PointsLedgerEntry[] = [
  {
    id: 'ledg-001',
    user_id: 'usr-consumer-01',
    transaction_type: 'CREDIT_VERIFICATION',
    points: 850,
    balance_after: 850,
    idempotency_key: 'idemp-init-cred-001',
    reference_id: 'list-init-01',
    reference_type: 'GADGET_LISTING',
    notes: 'Verified Dell Inspiron Motherboard & Battery recovery',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'ledg-002',
    user_id: 'usr-consumer-01',
    transaction_type: 'CREDIT_VERIFICATION',
    points: 400,
    balance_after: 1250,
    idempotency_key: 'idemp-init-cred-002',
    reference_id: 'list-init-02',
    reference_type: 'GADGET_LISTING',
    notes: 'Verified Samsung Galaxy S9 Precious Metal Recovery',
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

export const INITIAL_LISTINGS: GadgetListing[] = [
  {
    id: 'list-init-01',
    user_id: 'usr-consumer-01',
    device_category: 'laptop',
    brand: 'Dell',
    model: 'Inspiron 15 (2018)',
    physical_condition: 'WORKING_MINOR_DEFECTS',
    estimated_points: 850,
    final_points: 850,
    status: 'VERIFIED',
    intake_type: 'HUB_DROPOFF',
    hub_id: 'hub-blr-01',
    tracking_code: 'ECO-2026-DEL15',
    photos: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80'],
    valuation: calculateGadgetValuation('laptop', 'WORKING_MINOR_DEFECTS'),
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    verified_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'list-init-02',
    user_id: 'usr-consumer-01',
    device_category: 'smartphone',
    brand: 'Samsung',
    model: 'Galaxy S9',
    physical_condition: 'DEAD_NON_WORKING',
    estimated_points: 400,
    final_points: 400,
    status: 'VERIFIED',
    intake_type: 'HUB_DROPOFF',
    hub_id: 'hub-blr-01',
    tracking_code: 'ECO-2026-SAM09',
    photos: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80'],
    valuation: calculateGadgetValuation('smartphone', 'DEAD_NON_WORKING'),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    verified_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'list-init-03',
    user_id: 'usr-consumer-01',
    device_category: 'tablet',
    brand: 'Apple',
    model: 'iPad Air 2',
    physical_condition: 'WORKING_MINOR_DEFECTS',
    estimated_points: 620,
    status: 'RECEIVED_AT_HUB',
    intake_type: 'HUB_DROPOFF',
    hub_id: 'hub-blr-01',
    tracking_code: 'ECO-2026-IPAD2',
    photos: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80'],
    valuation: calculateGadgetValuation('tablet', 'WORKING_MINOR_DEFECTS'),
    created_at: new Date(Date.now() - 86400000 * 0.5).toISOString(),
  },
  {
    id: 'list-init-04',
    user_id: 'usr-consumer-02',
    device_category: 'crt_monitor',
    brand: 'LG',
    model: 'StudioWorks 700S',
    physical_condition: 'DEAD_NON_WORKING',
    estimated_points: 580,
    status: 'SCHEDULED',
    intake_type: 'PICKUP',
    pickup_address: '42, Cathedral Road, Guindy, Chennai - 600032',
    scheduled_slot: '2026-10-28 10:00 AM - 1:00 PM',
    tracking_code: 'ECO-2026-LGCRT',
    photos: ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80'],
    valuation: calculateGadgetValuation('crt_monitor', 'DEAD_NON_WORKING'),
    created_at: new Date(Date.now() - 86400000 * 0.2).toISOString(),
  },
];

export const INITIAL_FRAUD_FLAGS: FraudFlag[] = [
  {
    id: 'fraud-001',
    listing_id: 'list-flagged-01',
    user_id: 'usr-suspicious-01',
    user_name: 'Vikram Mehta',
    device: 'Apple iPhone 14 Pro Max',
    reason: 'Stock product catalog photo detected; serial number mismatch with device age; valuation requested 4 times in 10 minutes.',
    anomaly_score: 0.94,
    status: 'FLAGGED',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'fraud-002',
    listing_id: 'list-flagged-02',
    user_id: 'usr-suspicious-02',
    user_name: 'Anand Ray',
    device: 'Dell XPS 15 (Dead)',
    reason: 'Duplicate device chassis image flagged across 3 separate user accounts in past 48 hours.',
    anomaly_score: 0.88,
    status: 'UNDER_REVIEW',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];
