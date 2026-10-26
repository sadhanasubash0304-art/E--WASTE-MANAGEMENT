/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const HAZARD_CONFIDENCE_THRESHOLD = 0.85;

export const MIN_REDEMPTION_POINTS = 500;

export const BCRYPT_SALT_ROUNDS = 12;

export const POINTS_CONVERSION_FACTOR = 10; // 1 INR calculated metal value = 10 Green Points

export const COMMODITY_RATES_DEFAULT_INR_PER_KG = {
  copper: 850,       // ~850 INR/kg
  gold: 6200000,     // ~6,200,000 INR/kg (~6200/g)
  palladium: 3100000,// ~3,100,000 INR/kg
  lithium: 1800,     // ~1800 INR/kg
  aluminum: 240,     // ~240 INR/kg
  lead: 180,         // ~180 INR/kg
} as const;

export const SUPPORTED_LANGUAGES = ['en', 'ta', 'hi'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEVICE_CATEGORIES = [
  'smartphone',
  'laptop',
  'crt_monitor',
  'tablet',
  'desktop_pc',
] as const;
export type DeviceCategory = (typeof DEVICE_CATEGORIES)[number];

export const HAZARD_CLASSES = [
  'LI_ION_BATTERY',
  'CRT_LEAD',
  'MERCURY_SWITCH',
  'PCB_CAPACITOR',
  'TONER_POWDER',
] as const;
export type HazardClass = (typeof HAZARD_CLASSES)[number];

export const USER_ROLES = ['CONSUMER', 'HUB_WORKER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];
