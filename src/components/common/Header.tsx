/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Recycle,
  Smartphone,
  ShieldAlert,
  BarChart3,
  Globe2,
  Coins,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { UserRole, SupportedLanguage, User, CommodityPrices } from '../../types/index.ts';
import { translations } from '../../i18n/translations.ts';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  currentUser: User;
  walletBalance: number;
  rates: CommodityPrices;
  onOpenLedger: () => void;
  onOpenUserModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  language,
  onLanguageChange,
  currentUser,
  walletBalance,
  rates,
  onOpenLedger,
  onOpenUserModal,
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      {/* Ticker bar for commodity prices */}
      <div className="bg-emerald-950/80 border-b border-emerald-800/40 px-4 py-1 text-xs text-emerald-300 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded text-[10px]">
            <TrendingUp className="w-3 h-3" /> [MOCK] LME/MCX Live Metal Feed
          </span>
          <span className="text-slate-300">Cu: <b>₹{rates.copper}/kg</b></span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Au: <b>₹{Math.round(rates.gold / 1000)}/g</b></span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Pd: <b>₹{Math.round(rates.palladium / 1000)}/g</b></span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Li: <b>₹{rates.lithium}/kg</b></span>
        </div>
        <div className="text-[11px] text-emerald-400/80 font-mono hidden sm:block">
          ACID Ledger Active • India E-Waste 2022 Compliant
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Recycle className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                {t.appName}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                v1.0 Monorepo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Role Selector Tabs (Three Clients on One Backend) */}
        <nav className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => onRoleChange('CONSUMER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentRole === 'CONSUMER'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.consumerRole}</span>
            <span className="sm:hidden">Consumer</span>
          </button>

          <button
            onClick={() => onRoleChange('HUB_WORKER')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentRole === 'HUB_WORKER'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.workerRole}</span>
            <span className="sm:hidden">Worker AI</span>
          </button>

          <button
            onClick={() => onRoleChange('ADMIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              currentRole === 'ADMIN'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.adminRole}</span>
            <span className="sm:hidden">Admin</span>
          </button>
        </nav>

        {/* Right side controls: Language, Points Balance, User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language selector */}
          <div className="relative flex items-center">
            <Globe2 className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              aria-label={t.language}
              className="bg-slate-800 text-slate-200 text-xs font-medium pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>

          {/* Green Points Balance (Consumer & Admin view) */}
          <button
            onClick={onOpenLedger}
            title="View Immutable Points Ledger"
            className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-400 text-xs font-semibold transition-colors"
          >
            <Coins className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>{walletBalance}</span>
            <span className="text-[10px] text-emerald-500 hidden sm:inline">{t.pts}</span>
          </button>

          {/* Active User Avatar */}
          <button
            onClick={onOpenUserModal}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center font-bold text-emerald-400 text-[11px]">
              {currentUser.full_name.charAt(0)}
            </div>
            <span className="hidden lg:inline font-medium max-w-[120px] truncate">
              {currentUser.full_name}
            </span>
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
