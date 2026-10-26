/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserCheck, ShieldCheck, KeyRound, Smartphone, CheckCircle } from 'lucide-react';
import { User, UserRole, SupportedLanguage } from '../../types/index.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  currentUser: User;
  onSelectUser: (user: User) => void;
  onOtpLoginSuccess: (phone: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser,
  onOtpLoginSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'switch' | 'otp' | 'mfa'>('switch');
  const [phone, setPhone] = useState('+919876543210');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!phone || phone.length < 10) {
      setErrorMsg('Please enter a valid phone number with country code (e.g. +919876543210)');
      return;
    }
    setOtpSent(true);
    setOtpCode('842109'); // Simulated instantaneous OTP
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== '842109') {
      setErrorMsg('Invalid OTP. Use the simulated OTP code: 842109');
      return;
    }
    onOtpLoginSuccess(phone);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Identity & Authentication</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800">
          <button
            onClick={() => setAuthMode('switch')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'switch' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            Demo Profiles
          </button>
          <button
            onClick={() => setAuthMode('otp')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'otp' ? 'bg-slate-800 text-white' : 'text-slate-400'
            }`}
          >
            OTP Login Simulator
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-950/80 border border-red-700 p-2.5 rounded-xl text-xs text-red-300 mb-3">
            {errorMsg}
          </div>
        )}

        {/* MODE 1: DEMO PROFILES */}
        {authMode === 'switch' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-400 mb-2">
              Select one of the pre-configured statutory roles to explore the client interface:
            </p>
            {users.map((u) => {
              const isSelected = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    onSelectUser(u);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500/30'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{u.full_name}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : u.role === 'HUB_WORKER'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {u.phone_number} • Language: {u.preferred_language.toUpperCase()}
                    </span>
                  </div>

                  {isSelected && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* MODE 2: OTP LOGIN */}
        {authMode === 'otp' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Enter your registered Indian mobile number to receive a 6-digit OTP code:
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Send OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <div className="bg-emerald-950/60 border border-emerald-800 p-2.5 rounded-xl text-xs text-emerald-300">
                  OTP sent to <b>{phone}</b>. (Simulated Code: <span className="font-mono font-bold">842109</span>)
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">6-Digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-base text-center tracking-widest text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  Verify & Log In
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
