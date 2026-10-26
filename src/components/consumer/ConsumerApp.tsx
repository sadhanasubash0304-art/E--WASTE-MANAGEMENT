/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  Tv,
  Tablet,
  Cpu,
  Camera,
  CheckCircle2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ShoppingBag,
  ListOrdered,
  PlusCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  DeviceCategory,
  PhysicalCondition,
  IntakeType,
  GadgetListing,
  User,
  SupportedLanguage,
  Hub,
  Voucher,
  ValuationBreakdown,
} from '../../types/index.ts';
import { translations } from '../../i18n/translations.ts';
import {
  calculateGadgetValuation,
  SoundEffects,
  generateVoucherCode,
} from '../../services/store.ts';

interface ConsumerAppProps {
  currentUser: User;
  language: SupportedLanguage;
  hubs: Hub[];
  listings: GadgetListing[];
  vouchers: Voucher[];
  walletBalance: number;
  onCreateListing: (listing: GadgetListing) => void;
  onRedeemVoucher: (voucherId: string, voucherCode: string, pointsCost: number) => { success: boolean; error?: string };
}

export const ConsumerApp: React.FC<ConsumerAppProps> = ({
  currentUser,
  language,
  hubs,
  listings,
  vouchers,
  walletBalance,
  onCreateListing,
  onRedeemVoucher,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'recycle' | 'track' | 'vouchers'>('recycle');

  // 5-Step Listing Wizard State
  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState<DeviceCategory>('smartphone');
  const [brand, setBrand] = useState('Apple');
  const [model, setModel] = useState('iPhone 11');
  const [condition, setCondition] = useState<PhysicalCondition>('WORKING_MINOR_DEFECTS');
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
  ]);
  const [intakeType, setIntakeType] = useState<IntakeType>('HUB_DROPOFF');
  const [selectedHubId, setSelectedHubId] = useState<string>(hubs[0]?.id || '');
  const [pickupAddress, setPickupAddress] = useState('Flat 4B, Green Residency, Indiranagar, Bengaluru - 560038');
  const [scheduledDate, setScheduledDate] = useState('2026-10-28');
  const [createdTrackingCode, setCreatedTrackingCode] = useState<string | null>(null);

  // Voucher redemption state
  const [redeemedCode, setRedeemedCode] = useState<{ code: string; provider: string } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Calculate live valuation as user tweaks category & condition
  const liveValuation: ValuationBreakdown = calculateGadgetValuation(category, condition);

  const categories: Array<{ id: DeviceCategory; label: string; icon: React.ReactNode; desc: string }> = [
    { id: 'smartphone', label: 'Smartphone', icon: <Smartphone className="w-6 h-6" />, desc: 'Gold, Copper & Lithium' },
    { id: 'laptop', label: 'Laptop / Notebook', icon: <Laptop className="w-6 h-6" />, desc: 'High yield logic boards' },
    { id: 'tablet', label: 'Tablet / iPad', icon: <Tablet className="w-6 h-6" />, desc: 'Aluminum & pouch cells' },
    { id: 'crt_monitor', label: 'CRT Monitor / TV', icon: <Tv className="w-6 h-6" />, desc: 'Deflection yoke & heavy glass' },
    { id: 'desktop_pc', label: 'Desktop Tower / PC', icon: <Cpu className="w-6 h-6" />, desc: 'Steel, copper coils & PCBs' },
  ];

  const handleNextStep = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSamplePhotoAdd = () => {
    const samplePhotos = [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    ];
    const nextPhoto = samplePhotos[photos.length % samplePhotos.length];
    setPhotos([...photos, nextPhoto]);
  };

  const handleFinishListing = () => {
    const trackingCode = `ECO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newListing: GadgetListing = {
      id: `list-${Date.now()}`,
      user_id: currentUser.id,
      device_category: category,
      brand,
      model,
      physical_condition: condition,
      estimated_points: liveValuation.estimated_points,
      status: 'SUBMITTED',
      intake_type: intakeType,
      hub_id: intakeType === 'HUB_DROPOFF' ? selectedHubId : undefined,
      pickup_address: intakeType === 'PICKUP' ? pickupAddress : undefined,
      scheduled_slot: scheduledDate,
      tracking_code: trackingCode,
      photos,
      valuation: liveValuation,
      created_at: new Date().toISOString(),
    };

    onCreateListing(newListing);
    setCreatedTrackingCode(trackingCode);
    SoundEffects.playSuccessChime();
  };

  const handleRedeemClick = (voucher: Voucher) => {
    setVoucherError(null);
    if (walletBalance < voucher.points_cost) {
      setVoucherError(`Insufficient Green Points. You need ${voucher.points_cost} points, but currently have ${walletBalance}.`);
      return;
    }

    const code = generateVoucherCode(voucher.provider);
    const result = onRedeemVoucher(voucher.id, code, voucher.points_cost);
    if (result.success) {
      setRedeemedCode({ code, provider: voucher.provider });
      SoundEffects.playSuccessChime();
    } else {
      setVoucherError(result.error || 'Failed to redeem voucher.');
    }
  };

  const handleCopyCode = () => {
    if (redeemedCode) {
      navigator.clipboard.writeText(redeemedCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const userListings = listings.filter((l) => l.user_id === currentUser.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Client View Header & Navigation */}
      <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                {t.appName} {t.consumerRole}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Logged in as <span className="text-emerald-400 font-semibold">{currentUser.full_name}</span> ({currentUser.phone_number})
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-700/80 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('recycle')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'recycle'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.listGadget}</span>
            </button>

            <button
              onClick={() => setActiveTab('track')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                activeTab === 'track'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>{t.myListings}</span>
              {userListings.length > 0 && (
                <span className="ml-1 bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {userListings.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('vouchers')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vouchers'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{t.redeemVouchers}</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: 5-TAP LISTING WIZARD */}
      {activeTab === 'recycle' && (
        <div>
          {createdTrackingCode ? (
            /* Success confirmation screen */
            <div className="bg-slate-800 border border-emerald-500/40 rounded-2xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{t.successTitle}</h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto mb-6">
                Your device has been booked for recycling under India's E-Waste (Management) Rules 2022.
              </p>

              <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 max-w-sm mx-auto mb-6 text-left">
                <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                  <span>{t.trackingId}:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm tracking-wider">
                    {createdTrackingCode}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 mb-2">
                  <span>{t.instantPoints}:</span>
                  <span className="font-bold text-emerald-300 text-sm">
                    {liveValuation.estimated_points} {t.pts}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Method:</span>
                  <span className="text-slate-200 font-medium">
                    {intakeType === 'HUB_DROPOFF' ? 'Direct Hub Drop-off' : 'Doorstep Pickup'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-emerald-400/90 mb-8 bg-emerald-950/40 border border-emerald-800/40 py-2.5 px-4 rounded-xl max-w-md mx-auto">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t.pointsCreditedAfterHub}</span>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setCreatedTrackingCode(null);
                    setStep(1);
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors"
                >
                  Recycle Another Device
                </button>
                <button
                  onClick={() => setActiveTab('track')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
                >
                  View in My Tracking List
                </button>
              </div>
            </div>
          ) : (
            /* 5-Step Card */
            <div className="bg-slate-800/90 rounded-2xl border border-slate-700 shadow-2xl p-6 sm:p-8">
              {/* Step indicator */}
              <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    {t.step} {step} {t.of} 5
                  </span>
                  <h2 className="text-lg font-bold text-white">
                    {step === 1 && t.selectCategory}
                    {step === 2 && t.selectCondition}
                    {step === 3 && t.uploadPhotos}
                    {step === 4 && t.valuationSummary}
                    {step === 5 && t.scheduleDropoff}
                  </h2>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all ${
                        s === step
                          ? 'w-8 bg-emerald-500'
                          : s < step
                          ? 'w-3 bg-emerald-700'
                          : 'w-3 bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* STEP 1: CATEGORY SELECTION */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-300">
                    Choose the electronic device category to estimate circular recovery yields.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCategory(c.id)}
                        className={`flex flex-col items-start p-4 rounded-xl border text-left transition-all ${
                          category === c.id
                            ? 'bg-emerald-950/60 border-emerald-500 text-white ring-2 ring-emerald-500/30 shadow-lg'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-700/30'
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                            category === c.id ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {c.icon}
                        </div>
                        <span className="font-semibold text-sm text-white">{c.label}</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">{c.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: BRAND, MODEL & CONDITION */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Brand / Manufacturer
                      </label>
                      <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g. Apple, Dell, Samsung"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Model / Variant
                      </label>
                      <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="e.g. iPhone 11, Inspiron 15"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">
                      Physical Condition
                    </label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => setCondition('LIKE_NEW')}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                          condition === 'LIKE_NEW'
                            ? 'bg-emerald-950/60 border-emerald-500 text-white'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{t.likeNew}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Highest reusable component recovery factor (100%)</p>
                        </div>
                        <span className="text-emerald-400 text-xs font-bold font-mono">1.0x Factor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCondition('WORKING_MINOR_DEFECTS')}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                          condition === 'WORKING_MINOR_DEFECTS'
                            ? 'bg-emerald-950/60 border-emerald-500 text-white'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{t.workingDefects}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Refurbishable circuit and structural parts (85%)</p>
                        </div>
                        <span className="text-amber-400 text-xs font-bold font-mono">0.85x Factor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCondition('DEAD_NON_WORKING')}
                        className={`w-full p-3.5 rounded-xl border text-left flex items-start justify-between transition-all ${
                          condition === 'DEAD_NON_WORKING'
                            ? 'bg-emerald-950/60 border-emerald-500 text-white'
                            : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{t.deadNonWorking}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Pure mineral recovery & hazardous element safe handling (65%)</p>
                        </div>
                        <span className="text-cyan-400 text-xs font-bold font-mono">0.65x Factor</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PHOTO UPLOAD */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-300">
                      Upload 1 to 5 clear photos of the device (front, back, IMEI/serial label).
                    </p>
                    <button
                      type="button"
                      onClick={handleSamplePhotoAdd}
                      className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                    >
                      <Camera className="w-3.5 h-3.5" /> + Add Sample Photo
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {photos.map((url, i) => (
                      <div
                        key={i}
                        className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video group"
                      >
                        <img src={url} alt={`Device photo ${i + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-2 bg-slate-950/80 text-[10px] font-mono text-slate-200 px-1.5 py-0.5 rounded">
                          View {i + 1}
                        </span>
                        {photos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 bg-red-600/90 text-white p-1 rounded-md text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Photos are scanned via AI anti-fraud heuristics to detect stock or duplicate images.</span>
                  </div>
                </div>
              )}

              {/* STEP 4: INSTANT VALUATION BREAKDOWN */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/40 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Calculated Circular Value
                      </span>
                      <h3 className="text-2xl font-black text-white mt-0.5">
                        {liveValuation.estimated_points} <span className="text-sm font-semibold text-emerald-400">Green Points</span>
                      </h3>
                      <p className="text-xs text-slate-300 mt-1">
                        Equivalent to ₹{liveValuation.total_value_inr} recoverable metal value (10 pts per ₹1)
                      </p>
                    </div>

                    <div className="text-right bg-slate-900/80 px-4 py-2.5 rounded-xl border border-slate-700 text-xs">
                      <span className="text-slate-400 block text-[11px]">Category Composition</span>
                      <span className="text-white font-bold capitalize">{category}</span>
                      <span className="text-emerald-400 font-medium block text-[11px] mt-0.5">
                        {condition === 'LIKE_NEW' ? '100% Purity factor' : 'Recycling yield factor'}
                      </span>
                    </div>
                  </div>

                  {/* Component table breakdown */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                      {t.estimatedRecovery}
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900">
                      <table className="w-full text-xs text-left text-slate-300">
                        <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                          <tr>
                            <th className="px-3.5 py-2.5">Component</th>
                            <th className="px-3 py-2.5">Target Material</th>
                            <th className="px-3 py-2.5">Yield %</th>
                            <th className="px-3 py-2.5">Recovered Qty</th>
                            <th className="px-3 py-2.5 text-right">Est. Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {liveValuation.components.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50">
                              <td className="px-3.5 py-2 font-medium text-white">{item.component_name}</td>
                              <td className="px-3 py-2 capitalize">
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700">
                                  {item.primary_material}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-mono">{item.recovery_yield_pct}%</td>
                              <td className="px-3 py-2 font-mono">
                                {item.recovered_weight_grams >= 1000
                                  ? `${(item.recovered_weight_grams / 1000).toFixed(2)} kg`
                                  : `${item.recovered_weight_grams.toFixed(2)} g`}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-emerald-400">
                                ₹{item.estimated_value_inr}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: SCHEDULE PICKUP / DROPOFF */}
              {step === 5 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIntakeType('HUB_DROPOFF')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        intakeType === 'HUB_DROPOFF'
                          ? 'bg-emerald-950/60 border-emerald-500 text-white'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-sm">Direct Hub Drop-off</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {t.dropoffAtHub}
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIntakeType('PICKUP')}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        intakeType === 'PICKUP'
                          ? 'bg-emerald-950/60 border-emerald-500 text-white'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-sm">Doorstep Pickup</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {t.doorstepPickup}
                      </p>
                    </button>
                  </div>

                  {intakeType === 'HUB_DROPOFF' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        {t.selectHub}
                      </label>
                      <select
                        value={selectedHubId}
                        onChange={(e) => setSelectedHubId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {hubs.map((hub) => (
                          <option key={hub.id} value={hub.id}>
                            {hub.name} - {hub.city} ({hub.address})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          {t.pickupAddress}
                        </label>
                        <input
                          type="text"
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          {t.dateSlot}
                        </label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2">
                    <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {t.pointsCreditedAfterHub} An immutable ledger entry will be minted immediately upon worker verification.
                    </span>
                  </div>
                </div>
              )}

              {/* Wizard navigation buttons */}
              <div className="flex items-center justify-between border-t border-slate-700 pt-5 mt-6">
                <button
                  type="button"
                  onClick={handleBackStep}
                  disabled={step === 1}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    step === 1 ? 'opacity-30 cursor-not-allowed text-slate-500' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {t.back}
                </button>

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    {t.next} &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishListing}
                    className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-xl shadow-emerald-600/30 transition-all"
                  >
                    {t.submit}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY LISTINGS & TRACKING */}
      {activeTab === 'track' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{t.myListings}</h2>
            <button
              onClick={() => {
                setActiveTab('recycle');
                setStep(1);
                setCreatedTrackingCode(null);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              + Recycle Another Device
            </button>
          </div>

          {userListings.length === 0 ? (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center text-slate-400">
              <p className="text-sm">No gadget listings yet. Recycle your first device to earn Green Points!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userListings.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.photos[0] || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200'}
                      alt={item.model}
                      className="w-14 h-14 rounded-lg object-cover bg-slate-900 border border-slate-700 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {item.brand} {item.model}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : item.status === 'RECEIVED_AT_HUB'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                          }`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tracking: <span className="font-mono text-slate-200 font-semibold">{item.tracking_code}</span> •{' '}
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">
                        {item.status === 'VERIFIED' ? 'Earned Points' : 'Est. Points'}
                      </span>
                      <span className="font-black text-emerald-400 text-sm">
                        +{item.final_points || item.estimated_points} {t.pts}
                      </span>
                    </div>

                    {item.status === 'VERIFIED' && (
                      <span className="bg-emerald-950 text-emerald-400 text-[11px] px-2.5 py-1 rounded-lg border border-emerald-800 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Credited
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VOUCHER REDEMPTION STORE */}
      {activeTab === 'vouchers' && (
        <div className="space-y-5">
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">{t.voucherStore}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{t.minRedeemNotice}</p>
            </div>
            <div className="bg-emerald-950/80 border border-emerald-800 px-4 py-2 rounded-xl text-center">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold block">Available Balance</span>
              <span className="text-lg font-black text-white">{walletBalance} {t.pts}</span>
            </div>
          </div>

          {voucherError && (
            <div className="bg-red-950/80 border border-red-700/80 rounded-xl p-3 text-xs text-red-300">
              {voucherError}
            </div>
          )}

          {redeemedCode && (
            <div className="bg-emerald-950/90 border border-emerald-500 rounded-2xl p-6 text-center shadow-2xl">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
                {t.redeemSuccess}
              </span>
              <h3 className="text-xl font-bold text-white mb-3">
                {redeemedCode.provider} Gift Voucher
              </h3>

              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 max-w-sm mx-auto mb-4 flex items-center justify-between">
                <span className="font-mono text-lg font-black text-emerald-300 tracking-wider">
                  {redeemedCode.code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Single-use, cryptographically verified code. Redeemable immediately at checkout on {redeemedCode.provider}.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {vouchers.map((v) => {
              const canAfford = walletBalance >= v.points_cost;
              return (
                <div
                  key={v.id}
                  className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 flex flex-col justify-between hover:border-slate-600 transition-all shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-extrabold text-white text-sm tracking-wide">
                        {v.provider}
                      </span>
                      <span className="bg-slate-950 text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                        ₹{v.denomination_inr}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-4">
                      Instant digital e-gift voucher. Valid across all store categories.
                    </p>
                  </div>

                  <div className="border-t border-slate-700/80 pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cost</span>
                      <span className="font-black text-emerald-400 text-sm">{v.points_cost} {t.pts}</span>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleRedeemClick(v)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {t.redeemNow}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
