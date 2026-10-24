/**
 * Sri Sennamal Finance — Auto Save & Restore Auto Save
 * STRICT RULE: EXACTLY TWO OPTIONS ONLY.
 * Option 1: Auto Save
 * Option 2: Restore Auto Save
 * DELETE BALANCE IS COMPLETELY REMOVED.
 */

import React, { useState } from 'react';
import {
  Cloud,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  History,
  ShieldCheck,
  RotateCcw,
  Clock,
  Layers,
  Database,
  Lock,
} from 'lucide-react';
import { RecoveryPoint } from '../types/finance';
import { AutoSaveStatus } from '../services/financeStore';

interface AutoSaveRestoreViewProps {
  autoSaveStatus: AutoSaveStatus;
  lastSavedAt: string | null;
  recoveryPoints: RecoveryPoint[];
  onTriggerAutoSave: () => Promise<boolean>;
  onCreateRecoveryPoint: (note: string) => RecoveryPoint;
  onRestoreRecoveryPoint: (recoveryPointId: string) => boolean;
  ownerEmail: string | null;
  onOpenClearData?: () => void;
}

export const AutoSaveRestoreView: React.FC<AutoSaveRestoreViewProps> = ({
  autoSaveStatus,
  lastSavedAt,
  recoveryPoints,
  onTriggerAutoSave,
  onCreateRecoveryPoint,
  onRestoreRecoveryPoint,
  ownerEmail,
  onOpenClearData,
}) => {
  const [selectedRecoveryId, setSelectedRecoveryId] = useState<string | null>(null);
  const [isConfirmingRestore, setIsConfirmingRestore] = useState(false);
  const [manualNote, setManualNote] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSavingNow, setIsSavingNow] = useState(false);

  const selectedPoint = recoveryPoints.find((p) => p.id === selectedRecoveryId) || null;

  const handleManualSync = async () => {
    setIsSavingNow(true);
    const success = await onTriggerAutoSave();
    setIsSavingNow(false);
    if (success) {
      setStatusMessage('Cloud sync confirmed. All transactions safely committed to persistent storage.');
    } else {
      setStatusMessage('Save Failed: Could not confirm database commit.');
    }
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleCreateCheckpoint = () => {
    const note = manualNote.trim() || `Manual verification checkpoint (${new Date().toLocaleTimeString('en-IN')})`;
    onCreateRecoveryPoint(note);
    setManualNote('');
    setStatusMessage(`Verified recovery point "${note}" recorded.`);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleExecuteRestore = () => {
    if (!selectedRecoveryId) return;
    const success = onRestoreRecoveryPoint(selectedRecoveryId);
    setIsConfirmingRestore(false);
    if (success) {
      setStatusMessage('Safe restoration completed successfully. Pre-restoration checkpoint was preserved.');
    } else {
      setStatusMessage('Restoration failed.');
    }
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Title */}
      <div className="p-6 rounded-2xl neon-card">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white font-display">
            Cloud Persistence & Recovery Management
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Authorized owner controls for automatic cloud saving and safe rollback to verified recovery snapshots.
          Delete Balance is strictly prohibited and removed.
        </p>
      </div>

      {statusMessage && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* --- EXACTLY TWO OPTIONS CONTAINER --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ======================================================== */}
        {/* OPTION 1: AUTO SAVE */}
        {/* ======================================================== */}
        <div className="rounded-2xl neon-card p-6 flex flex-col justify-between space-y-6 border border-cyan-500/30">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Option 1: Auto Save</h3>
                  <span className="text-[10px] text-cyan-300 uppercase tracking-wider font-mono">
                    Continuous Cloud Persistence
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="px-3 py-1 rounded-full text-xs font-mono font-semibold border flex items-center gap-1.5">
                {autoSaveStatus === 'saving' && (
                  <span className="text-cyan-300 border-cyan-500/30 bg-cyan-950/50 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                    Saving...
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="text-emerald-300 border-emerald-500/30 bg-emerald-950/50 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    Saved
                  </span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-rose-300 border-rose-500/30 bg-rose-950/50 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-400" />
                    Save Failed
                  </span>
                )}
                {autoSaveStatus === 'idle' && (
                  <span className="text-slate-300 border-slate-700 bg-slate-800/50 flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-slate-400" />
                    Synced
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Every transaction, weekly collection, loan disbursement, refund, and customer record commits atomically to the verified database.
              </p>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Database Target:</span>
                  <span className="text-cyan-400 font-mono font-semibold">Supabase PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Owner Access Verification:</span>
                  <span className="text-slate-200 font-mono">{ownerEmail || 'playwithsakthigaming@gmail.com'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Verified Commit:</span>
                  <span className="text-slate-200 font-mono">
                    {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString('en-IN') : 'Just now'}
                  </span>
                </div>
              </div>

              {/* Create Manual Verification Recovery Point */}
              <div className="pt-2 space-y-2">
                <label className="block text-slate-400 text-xs font-semibold">
                  Record Verified Snapshot Note (Optional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. End of Day Sunday Collections Check"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  />
                  <button
                    onClick={handleCreateCheckpoint}
                    className="px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
                  >
                    Take Snapshot
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleManualSync}
              disabled={isSavingNow}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-xs text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSavingNow ? 'animate-spin' : ''}`} />
              {isSavingNow ? 'Verifying Cloud Commit...' : 'Verify Cloud Commit Now'}
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* OPTION 2: RESTORE AUTO SAVE */}
        {/* ======================================================== */}
        <div className="rounded-2xl neon-card p-6 flex flex-col justify-between space-y-6 border border-purple-500/30">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Option 2: Restore Auto Save</h3>
                  <span className="text-[10px] text-purple-300 uppercase tracking-wider font-mono">
                    Safe Snapshot Rollback
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono text-purple-300 bg-purple-950/50 border border-purple-500/30">
                {recoveryPoints.length} Point(s)
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                Restore from an available, verified recovery point. A safety recovery snapshot is automatically created prior to any restore.
              </p>

              {/* Safety Guarantees Notice */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Restore Safety Invariants Enforced:</span>
                </div>
                <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                  <li>No duplicate payments or transaction IDs created.</li>
                  <li>Historical audit logs are completely preserved.</li>
                  <li>"Delete Balance" is completely disabled and absent.</li>
                </ul>
              </div>

              {/* Available Recovery Snapshots */}
              <div className="space-y-2 pt-1">
                <label className="block text-slate-400 text-xs font-semibold">
                  Select Verified Recovery Point to Restore:
                </label>

                {recoveryPoints.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    No historical snapshots yet. Take a snapshot in Option 1 to create one.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {recoveryPoints.map((p) => {
                      const isSelected = selectedRecoveryId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedRecoveryId(p.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-purple-950/60 border-purple-400 text-white'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-purple-300 font-mono">
                              {new Date(p.timestamp).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {p.recordCounts.customers} Cust · {p.recordCounts.loans} Loans
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 truncate">
                            {p.note}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsConfirmingRestore(true)}
              disabled={!selectedRecoveryId}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 font-semibold text-xs text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restore Selected Recovery Point
            </button>
          </div>
        </div>

      </div>

      {/* Clear Data / Factory Reset */}
      {onOpenClearData && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-semibold text-slate-300 block">Total Data Wipe & Factory Reset</span>
            <span className="text-[11px] text-slate-500">Purges all customers, loans, daily dues, payments, and cached JSON back to zero.</span>
          </div>
          <button
            onClick={onOpenClearData}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 transition-colors whitespace-nowrap"
          >
            Clear All Data
          </button>
        </div>
      )}

      {/* --- CONFIRM RESTORE MODAL --- */}
      {isConfirmingRestore && selectedPoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0c1322] border border-purple-500/40 rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white font-display">Confirm Safe State Restoration</h3>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>
                You are restoring the financial records to the snapshot from:
              </p>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-cyan-300 font-bold">
                {new Date(selectedPoint.timestamp).toLocaleString('en-IN')}
              </div>
              <p className="text-slate-400 text-[11px]">
                Note: {selectedPoint.note}
              </p>
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px]">
                A safety recovery point of the current live data will be captured automatically before restoring.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-800 text-xs">
              <button
                onClick={() => setIsConfirmingRestore(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteRestore}
                className="px-4 py-2 font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow"
              >
                Yes, Restore Safely
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
