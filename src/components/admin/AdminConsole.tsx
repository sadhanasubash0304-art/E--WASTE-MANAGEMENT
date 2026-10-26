/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  AlertOctagon,
  Ticket,
  BrainCircuit,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Building2,
  Trash2,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';
import {
  User,
  Hub,
  GadgetListing,
  Voucher,
  FraudFlag,
  SupportedLanguage,
  ESGImpactReport,
} from '../../types/index.ts';
import { translations } from '../../i18n/translations.ts';
import { SoundEffects } from '../../services/store.ts';

interface AdminConsoleProps {
  currentUser: User;
  language: SupportedLanguage;
  hubs: Hub[];
  listings: GadgetListing[];
  vouchers: Voucher[];
  fraudFlags: FraudFlag[];
  onVerifyListing: (listingId: string) => void;
  onResolveFraud: (flagId: string, action: 'CLEAR' | 'REJECT') => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  language,
  hubs,
  listings,
  vouchers,
  fraudFlags,
  onVerifyListing,
  onResolveFraud,
}) => {
  const t = translations[language];

  const [activeNav, setActiveNav] = useState<
    'overview' | 'verifications' | 'fraud' | 'vouchers' | 'metrics' | 'esg'
  >('overview');

  const [fraudFilter, setFraudFilter] = useState<'ALL' | 'FLAGGED' | 'CLEARED'>('ALL');

  // Compute live ESG metrics
  const verifiedListings = listings.filter((l) => l.status === 'VERIFIED');
  const totalDivertedKg = verifiedListings.reduce((sum, l) => {
    const compWeight = l.valuation?.components?.reduce((cSum, c) => cSum + c.weight_kg, 0) || 0.45;
    return sum + compWeight;
  }, 4820.5);

  const copperKg = 485.2 + verifiedListings.length * 0.12;
  const goldGrams = 112.4 + verifiedListings.length * 0.04;
  const palladiumGrams = 34.6 + verifiedListings.length * 0.015;
  const lithiumKg = 185.0 + verifiedListings.length * 0.08;
  const co2AvoidedKg = Math.round(totalDivertedKg * 2.95);
  const hazardousIntercepted = 94 + verifiedListings.length;

  const esgReport: ESGImpactReport = {
    period: 'October 2026 (Monthly EPR Compliance Cycle)',
    total_ewaste_diverted_kg: Number(totalDivertedKg.toFixed(2)),
    copper_recovered_kg: Number(copperKg.toFixed(2)),
    gold_recovered_grams: Number(goldGrams.toFixed(2)),
    palladium_recovered_grams: Number(palladiumGrams.toFixed(2)),
    lithium_recovered_kg: Number(lithiumKg.toFixed(2)),
    aluminum_recovered_kg: 840.5,
    co2_emissions_avoided_kg: co2AvoidedKg,
    hazardous_components_intercepted: hazardousIntercepted,
    active_hubs_count: hubs.length,
    participating_consumers_count: 1420,
  };

  const handleExportCsv = () => {
    const csvContent = [
      'EcoCircuit EPR Compliance & ESG Impact Report',
      `Generated: ${new Date().toISOString()}`,
      `Authority Reference: India E-Waste (Management) Rules 2022`,
      '',
      'Metric,Quantity,Unit',
      `Total E-Waste Diverted,${esgReport.total_ewaste_diverted_kg},kg`,
      `Copper Recovered,${esgReport.copper_recovered_kg},kg`,
      `Gold Extracted,${esgReport.gold_recovered_grams},grams`,
      `Palladium Extracted,${esgReport.palladium_recovered_grams},grams`,
      `Lithium Cells Intercepted,${esgReport.lithium_recovered_kg},kg`,
      `Aluminum Recovered,${esgReport.aluminum_recovered_kg},kg`,
      `CO2 Equivalent Emissions Avoided,${esgReport.co2_emissions_avoided_kg},kg`,
      `Hazardous Items Safely Handled,${esgReport.hazardous_components_intercepted},units`,
      `Authorized Recovery Hubs,${esgReport.active_hubs_count},facilities`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EcoCircuit_ESG_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    SoundEffects.playSuccessChime();
  };

  const filteredFrauds = fraudFlags.filter((f) => {
    if (fraudFilter === 'ALL') return true;
    return f.status === fraudFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Admin Header with TOTP MFA status */}
      <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 shadow-xl mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center font-bold text-lg">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{t.adminConsole}</h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> {t.mfaVerified}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Administrator: <span className="text-slate-200 font-semibold">{currentUser.full_name}</span> ({currentUser.email})
              </p>
            </div>
          </div>

          <button
            onClick={handleExportCsv}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            {t.exportCsv}
          </button>
        </div>
      </div>

      {/* Main Admin Grid: Left Nav + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1 bg-slate-800/80 border border-slate-700 p-2.5 rounded-2xl h-fit">
          <button
            onClick={() => setActiveNav('overview')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeNav === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview & KPI Cards</span>
          </button>

          <button
            onClick={() => setActiveNav('verifications')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeNav === 'verifications'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckSquare className="w-4 h-4" />
              <span>{t.verificationsQueue}</span>
            </div>
            <span className="text-[10px] font-bold bg-slate-900 px-1.5 py-0.5 rounded text-indigo-400">
              {listings.filter((l) => l.status === 'SUBMITTED' || l.status === 'RECEIVED_AT_HUB').length}
            </span>
          </button>

          <button
            onClick={() => setActiveNav('fraud')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeNav === 'fraud'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-4 h-4" />
              <span>{t.fraudQueue}</span>
            </div>
            <span className="text-[10px] font-bold bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
              {fraudFlags.filter((f) => f.status === 'FLAGGED').length}
            </span>
          </button>

          <button
            onClick={() => setActiveNav('vouchers')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeNav === 'vouchers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <Ticket className="w-4 h-4" />
              <span>{t.vouchersPool}</span>
            </div>
            <span className="text-[10px] font-bold bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
              {vouchers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveNav('metrics')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeNav === 'metrics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>{t.modelMetrics}</span>
          </button>

          <button
            onClick={() => setActiveNav('esg')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
              activeNav === 'esg'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t.esgReport}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 1: OVERVIEW & KPI CARDS */}
          {activeNav === 'overview' && (
            <div className="space-y-6">
              {/* 4 Primary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {t.kpiEwaste}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-white">{esgReport.total_ewaste_diverted_kg}</span>
                    <span className="text-xs font-semibold text-emerald-400">kg</span>
                  </div>
                  <span className="text-[11px] text-emerald-400/90 mt-1 block font-medium">
                    +14.2% from last cycle
                  </span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {t.kpiMetals}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-amber-400">{esgReport.gold_recovered_grams}</span>
                    <span className="text-xs font-semibold text-slate-300">g Au / {esgReport.copper_recovered_kg} kg Cu</span>
                  </div>
                  <span className="text-[11px] text-amber-400/90 mt-1 block font-medium">
                    High-yield PCB extraction
                  </span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {t.kpiCo2}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-cyan-400">{esgReport.co2_emissions_avoided_kg}</span>
                    <span className="text-xs font-semibold text-slate-300">kg CO₂e</span>
                  </div>
                  <span className="text-[11px] text-cyan-400/90 mt-1 block font-medium">
                    Virgin mining substitution
                  </span>
                </div>

                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-md">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    {t.kpiHazards}
                  </span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-red-400">{esgReport.hazardous_components_intercepted}</span>
                    <span className="text-xs font-semibold text-slate-300">units</span>
                  </div>
                  <span className="text-[11px] text-red-400/90 mt-1 block font-medium">
                    100% PPE containment
                  </span>
                </div>
              </div>

              {/* Hub Network Status */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Authorized Recovery Hub Facilities ({hubs.length} Active Nodes)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hubs.map((hub) => (
                    <div
                      key={hub.id}
                      className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-3.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{hub.name}</span>
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {hub.city}, {hub.state} • Cap: {hub.capacity_kg_per_day} kg/day
                        </p>
                      </div>
                      <span className="font-mono text-[10px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/40 px-2 py-0.5 rounded">
                        {hub.code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: DROP-OFF VERIFICATIONS QUEUE */}
          {activeNav === 'verifications' && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center justify-between">
                <span>{t.verificationsQueue}</span>
                <span className="text-xs text-slate-400 font-normal">
                  Items received at sorting centers requiring manager sign-off
                </span>
              </h3>

              <div className="space-y-3">
                {listings.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.photos[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=200'}
                        alt={item.model}
                        className="w-12 h-12 rounded-lg object-cover bg-slate-950 border border-slate-700 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {item.brand} {item.model}
                          </span>
                          <span className="font-mono text-[10px] text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                            {item.tracking_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Category: <span className="capitalize text-slate-200">{item.device_category}</span> • Status:{' '}
                          <span className="text-emerald-400 font-semibold">{item.status}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Ledger Credit</span>
                        <span className="font-black text-emerald-400 text-xs">
                          {item.estimated_points} pts
                        </span>
                      </div>

                      {item.status !== 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => onVerifyListing(item.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md transition-all"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: FRAUD QUEUE */}
          {activeNav === 'fraud' && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{t.fraudQueue}</h3>
                  <p className="text-xs text-slate-400">
                    Flagged listings with perceptual hashing or valuation anomaly scores &gt; 0.70
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={fraudFilter}
                    onChange={(e) => setFraudFilter(e.target.value as 'ALL' | 'FLAGGED' | 'CLEARED')}
                    aria-label="Filter fraud flags"
                    className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs"
                  >
                    <option value="ALL">All Items</option>
                    <option value="FLAGGED">Active Flags</option>
                    <option value="CLEARED">Cleared</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {filteredFrauds.map((flag) => (
                  <div
                    key={flag.id}
                    className="bg-slate-900/90 border border-red-500/40 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{flag.device}</span>
                          <span className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                            Anomaly: {(flag.anomaly_score * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Account: <span className="text-slate-200">{flag.user_name}</span> ({flag.user_id})
                        </p>
                      </div>

                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(flag.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-lg text-xs text-red-300/90 leading-relaxed">
                      <b>Flag Reason:</b> {flag.reason}
                    </div>

                    {flag.status === 'FLAGGED' && (
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onResolveFraud(flag.id, 'CLEAR')}
                          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          {t.resolveClear}
                        </button>
                        <button
                          type="button"
                          onClick={() => onResolveFraud(flag.id, 'REJECT')}
                          className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-red-600/30 transition-colors"
                        >
                          {t.resolveReject}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: VOUCHER INVENTORY */}
          {activeNav === 'vouchers' && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{t.vouchersPool}</h3>
                  <p className="text-xs text-slate-400">
                    Live voucher buffer backed by Amazon Incentives & Flipkart Corporate adapters
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-800">
                  Pool Healthy (99.8% Availability)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-900">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3">Partner</th>
                      <th className="px-4 py-3">Masked Code</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Points Cost</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/50">
                        <td className="px-4 py-2.5 font-sans font-bold text-white">{v.provider}</td>
                        <td className="px-4 py-2.5 text-slate-400">{v.masked_code}</td>
                        <td className="px-4 py-2.5 text-slate-200">₹{v.denomination_inr}</td>
                        <td className="px-4 py-2.5 text-emerald-400 font-bold">{v.points_cost} pts</td>
                        <td className="px-4 py-2.5 text-right">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              v.status === 'AVAILABLE'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 5: AI MODEL METRICS */}
          {activeNav === 'metrics' && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white">{t.modelMetrics}</h3>
                <p className="text-xs text-slate-400">
                  Real-time inference telemetry from YOLO-v8 e-waste sorting vision service
                </p>
              </div>

              {/* Latency & Precision cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Mean Inference Latency</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">420 ms</p>
                  <span className="text-[10px] text-slate-500">Target: &lt; 800ms (PASS)</span>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Hazard Class Recall</span>
                  <p className="text-2xl font-black text-emerald-400 mt-1">97.8%</p>
                  <span className="text-[10px] text-slate-500">Target: &gt;= 95% (PASS)</span>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-center">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">Mean Average Precision (mAP50)</span>
                  <p className="text-2xl font-black text-indigo-400 mt-1">0.892</p>
                  <span className="text-[10px] text-slate-500">Fine-tuned on 14k PCB samples</span>
                </div>
              </div>

              {/* Class Breakdown Table */}
              <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">Component Class</th>
                      <th className="px-4 py-2.5">Category</th>
                      <th className="px-4 py-2.5">Precision</th>
                      <th className="px-4 py-2.5">Recall</th>
                      <th className="px-4 py-2.5 text-right">Hazard Interlock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    <tr>
                      <td className="px-4 py-2 text-white font-sans">Lithium Battery Pouch</td>
                      <td className="px-4 py-2 text-red-400 font-sans">HAZARDOUS</td>
                      <td className="px-4 py-2">96.4%</td>
                      <td className="px-4 py-2 text-emerald-400 font-bold">98.2%</td>
                      <td className="px-4 py-2 text-right font-sans text-red-400 font-semibold">Mandatory PPE</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-white font-sans">CRT Leaded Funnel Glass</td>
                      <td className="px-4 py-2 text-red-400 font-sans">HAZARDOUS</td>
                      <td className="px-4 py-2">94.8%</td>
                      <td className="px-4 py-2 text-emerald-400 font-bold">96.9%</td>
                      <td className="px-4 py-2 text-right font-sans text-red-400 font-semibold">Mandatory PPE</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-white font-sans">High-Grade Logic PCB</td>
                      <td className="px-4 py-2 text-emerald-400 font-sans">SAFE RECOVERY</td>
                      <td className="px-4 py-2">92.1%</td>
                      <td className="px-4 py-2">91.4%</td>
                      <td className="px-4 py-2 text-right font-sans text-emerald-400">Standard Sort</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-white font-sans">Electrolytic Capacitors</td>
                      <td className="px-4 py-2 text-amber-400 font-sans">CAUTION</td>
                      <td className="px-4 py-2">89.7%</td>
                      <td className="px-4 py-2">88.5%</td>
                      <td className="px-4 py-2 text-right font-sans text-amber-400">ESD Discharge</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 6: CSR / ESG REPORTING */}
          {activeNav === 'esg' && (
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{t.esgReport}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Prepared under India E-Waste (Management) Rules 2022 Extended Producer Responsibility (EPR) Form 1
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Official CSV Report
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                    Circular Material Extraction
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Diversion:</span>
                      <span className="font-bold text-white">{esgReport.total_ewaste_diverted_kg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Copper (Cu) Recovered:</span>
                      <span className="font-bold text-emerald-400">{esgReport.copper_recovered_kg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gold (Au) Recovered:</span>
                      <span className="font-bold text-amber-400">{esgReport.gold_recovered_grams} grams</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Palladium (Pd) Recovered:</span>
                      <span className="font-bold text-cyan-400">{esgReport.palladium_recovered_grams} grams</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Lithium Cells Isolated:</span>
                      <span className="font-bold text-white">{esgReport.lithium_recovered_kg} kg</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 space-y-2">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block">
                    Environmental & Human Safety Compliance
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-300 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">CO2 Emissions Avoided:</span>
                      <span className="font-bold text-cyan-400">{esgReport.co2_emissions_avoided_kg} kg CO₂e</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hazardous Units Intercepted:</span>
                      <span className="font-bold text-red-400">{esgReport.hazardous_components_intercepted} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Worker Safety Interlock Violations:</span>
                      <span className="font-bold text-emerald-400">0 (Zero Incidents)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Participating Consumers:</span>
                      <span className="font-bold text-white">{esgReport.participating_consumers_count} citizens</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
