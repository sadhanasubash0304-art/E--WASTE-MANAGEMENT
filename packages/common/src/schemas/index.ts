/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import {
  DEVICE_CATEGORIES,
  SUPPORTED_LANGUAGES,
  USER_ROLES,
  MIN_REDEMPTION_POINTS,
  HAZARD_CLASSES,
} from '../constants/index.ts';

// 1. Auth Schemas
export const RequestOtpSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number format with country code'),
});

export const VerifyOtpSchema = z.object({
  phoneNumber: z.string().regex(/^\+?[1-9]\d{9,14}$/),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  totpCode: z.string().length(6, 'TOTP code must be 6 digits').optional(),
});

// 2. Gadget Listing Schema (Consumer)
export const CreateListingSchema = z.object({
  deviceCategory: z.enum(DEVICE_CATEGORIES),
  brand: z.string().min(2).max(80),
  model: z.string().min(2).max(100),
  physicalCondition: z.enum(['LIKE_NEW', 'WORKING_MINOR_DEFECTS', 'DEAD_NON_WORKING']),
  intakeType: z.enum(['PICKUP', 'HUB_DROPOFF']),
  hubId: z.string().uuid().optional(),
  scheduledSlot: z.string().datetime().optional(),
  photos: z.array(z.string().url().or(z.string().startsWith('data:image/'))).min(1).max(5),
});

// 3. Points Redemption Schema
export const RedeemVoucherSchema = z.object({
  voucherId: z.string().uuid(),
  idempotencyKey: z.string().min(16).max(128),
});

// 4. Hub Worker Hazard Acknowledgment Schema
export const AcknowledgeHazardSchema = z.object({
  sessionId: z.string().uuid(),
  itemId: z.string().uuid(),
  hazardClass: z.enum(HAZARD_CLASSES),
  workerId: z.string().uuid(),
  acknowledgedPpe: z.boolean().refine((val) => val === true, {
    message: 'Worker must verify PPE has been equipped before handling hazardous e-waste',
  }),
});

// 5. Hub Worker Verification Schema
export const VerifyListingDropoffSchema = z.object({
  listingId: z.string().uuid(),
  hubId: z.string().uuid(),
  workerId: z.string().uuid(),
  status: z.enum(['VERIFIED', 'REJECTED']),
  rejectionReason: z.string().optional(),
  actualWeightKg: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

// 6. Scan Frame WebSocket Message Schema
export const ScanFrameMessageSchema = z.object({
  type: z.literal('FRAME'),
  sessionId: z.string().uuid(),
  timestamp: z.number(),
  imageJpegBase64: z.string().min(100),
});
