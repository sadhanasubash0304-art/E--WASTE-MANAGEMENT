/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, CheckCircle2, ShieldAlert, Sparkles, Coins, RefreshCw } from 'lucide-react';
import { PointsLedgerEntry } from '../../types/index.ts';

interface LedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: PointsLedgerEntry[];
  currentBalance: number;
  onSimulateConcurrencyTest: () => { success: boolean; message: string };
}

export const LedgerModal: React.FC<LedgerModalProps> = ({
  isOpen,
  onClose,
  entries,
  currentBalance,
  onSimulateConcurrencyTest,
}) => {
  const [testResult, setTestResult] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestClick = () => {
    const res = onSimulateConcurrencyTest();
    setTestResult(res.message);
    setTimeout(() => setTestResult(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Immutable Points Ledger</h3>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  ACID Append-Only
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Guaranteed idempotency • Zero double-spending via row-level locks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance & Concurrency Test Action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 p-4 rounded-xl mb-4">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block">Calculated Derived Balance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400">{currentBalance}</span>
              <span className="text-xs font-semibold text-slate-300">Green Points</span>
            </div>
          </div>

          <button
            onClick={handleTestClick}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Run Double-Spend Concurrency Test
          </button>
        </div>

        {testResult && (
          <div className="bg-emerald-950/90 border border-emerald-500 rounded-xl p-3 text-xs text-emerald-300 font-mono mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Ledger Entries Table */}
        <div className="overflow-y-auto flex-1 rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-800/90 text-slate-400 font-semibold border-b border-slate-800 sticky top-0">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Transaction</th>
                <th className="px-4 py-3">Points</th>
                <th className="px-4 py-3">Balance After</th>
                <th className="px-4 py-3">Idempotency Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 text-slate-400">
                    {new Date(entry.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-sans">
                    <span
                      className={`font-semibold ${
                        entry.transaction_type.startsWith('CREDIT')
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {entry.transaction_type}
                    </span>
                    <span className="block text-[10px] text-slate-500 font-sans mt-0.5">
                      {entry.notes}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-bold">
                    <span
                      className={
                        entry.points >= 0 ? 'text-emerald-400' : 'text-amber-400'
                      }
                    >
                      {entry.points > 0 ? `+${entry.points}` : entry.points}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-bold text-white">
                    {entry.balance_after}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-[140px] truncate" title={entry.idempotency_key}>
                    {entry.idempotency_key}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
