/**
 * Sri Sennamal Finance — Clear Data (Factory Reset) Modal
 * "Clear data kudutha all data, customer, josn to db varaikum clear aganum"
 * Completely purges all customers, loans, daily dues, weekly dues, SP loans,
 * installments, collections, receipts, ledger, recovery points, and JSON/storage.
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Check,
} from 'lucide-react';
import { financeStore } from '../services/financeStore';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerCount: number;
  loanCount: number;
  paymentCount: number;
  onCleared?: () => void;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  customerCount,
  loanCount,
  paymentCount,
  onCleared,
}) => {
  const [confirmInput, setConfirmInput] = useState('');
  const [isConfirmedByCheckbox, setIsConfirmedByCheckbox] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearedSuccess, setClearedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExecuteClear = async () => {
    setIsClearing(true);
    try {
      await financeStore.clearAllData();
      setClearedSuccess(true);
      setTimeout(() => {
        setIsClearing(false);
        setClearedSuccess(false);
        setConfirmInput('');
        setIsConfirmedByCheckbox(false);
        onClose();
        if (onCleared) onCleared();
      }, 1000);
    } catch (e) {
      console.error('Failed to clear data', e);
      setIsClearing(false);
    }
  };



  const isTypedClear = confirmInput.trim().toUpperCase() === 'CLEAR';
  // Allow clearing if user typed CLEAR, OR checked the confirmation box, OR clicks directly
  const canClear = isTypedClear || isConfirmedByCheckbox;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0b0f1a] border border-rose-500/40 rounded-2xl shadow-[0_0_40px_rgba(244,63,94,0.25)] p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-950/70 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Clear All Data · Factory Reset
              </h3>
              <span className="text-[10px] text-rose-300 font-mono uppercase tracking-wider">
                முழுமையான தரவு அழிப்பு (Clear Database & JSON)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {clearedSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">All Data Cleared Successfully</h4>
            <p className="text-xs text-slate-400">
              All customers, loans, daily dues, collections, and JSON storage reset to 0.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-xs">
            {/* Warning Banner */}
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-300">Permanent Slate Wipe (Zero Records)</span>
                All customers, weekly loans, Day Due daily loans, SP loans, installments, payment records, receipts, ledger entries, and stored JSON state will be deleted completely.
              </div>
            </div>

            {/* Current Data Scope to be Cleared */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Current Records to be Cleared:
              </span>
              <div className="grid grid-cols-3 gap-2 text-center font-tabular text-xs">
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Customers</span>
                  <span className="font-bold text-white text-sm">{customerCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Loans</span>
                  <span className="font-bold text-cyan-300 text-sm">{loanCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Collections</span>
                  <span className="font-bold text-amber-300 text-sm">{paymentCount}</span>
                </div>
              </div>
            </div>

            {/* Confirmation Options: 1-Click Checkbox OR Type CLEAR */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isConfirmedByCheckbox}
                  onChange={(e) => setIsConfirmedByCheckbox(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-700"
                />
                <span className="text-slate-200 font-semibold text-xs">
                  I understand this will permanently delete all records (reset to 0)
                </span>
              </label>

              <div className="pt-1 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or type CLEAR to confirm"
                  value={confirmInput}
                  onChange={(e) => setConfirmInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase text-xs focus:outline-none focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    setConfirmInput('CLEAR');
                    setIsConfirmedByCheckbox(true);
                  }}
                  className="px-2.5 py-1.5 text-[10px] font-semibold text-rose-300 bg-rose-950/60 border border-rose-500/30 rounded-lg hover:bg-rose-900/50"
                >
                  Auto-Fill CLEAR
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isClearing}
                className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
                <button
                  type="button"
                  onClick={handleExecuteClear}
                  disabled={!canClear || isClearing}
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 rounded-lg shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all flex items-center justify-center gap-1.5"
                >
                  {isClearing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isClearing ? 'Clearing...' : 'Clear All Data (Wipe Everything)'}
                </button>
              </div>
            </div>
        )}

      </div>
    </div>
  );
};
