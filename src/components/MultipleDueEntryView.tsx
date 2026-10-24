/**
 * Sri Sennamal Finance — Multiple Weekly Due Collection Desk
 * Supports collecting multiple installments (e.g. 10 weeks @ ₹500 = ₹5,000)
 * via Method 1 (Amount Received) or Method 2 (Select Installments count / specific weeks).
 * Excess amount handler, automatic settlement preview, and single unified receipt.
 */

import React, { useState, useEffect } from 'react';
import {
  Coins,
  CheckCircle,
  AlertCircle,
  Receipt,
  ArrowRight,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Customer, Installment, Loan, Payment } from '../types/finance';
import {
  calculateMultipleDueAllocation,
  formatCoveredWeeksSummary,
  formatIndianCurrency,
} from '../utils/financeCalculations';

interface MultipleDueEntryViewProps {
  loans: Loan[];
  customers: Customer[];
  installments: Installment[];
  preSelectedLoanId?: string;
  onCollectDues: (params: {
    loanId: string;
    amountReceived: number;
    paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
    referenceNo?: string;
    notes?: string;
    selectedInstallmentIds?: string[];
    excessAllocation?: 'next_due' | 'principal' | 'advance';
  }) => { payment: Payment; coveredWeeksText: string };
  onViewReceipt: (payment: Payment) => void;
}

export const MultipleDueEntryView: React.FC<MultipleDueEntryViewProps> = ({
  loans,
  customers,
  installments,
  preSelectedLoanId,
  onCollectDues,
  onViewReceipt,
}) => {
  // Installment loans (Weekly and Day Due)
  const installmentLoans = loans.filter(
    (l) => (l.loanType === 'standard_weekly' || l.loanType === 'daily_due') && l.status !== 'completed'
  );

  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    preSelectedLoanId || (installmentLoans[0]?.id || '')
  );

  const [inputMethod, setInputMethod] = useState<'amount' | 'count'>('amount');
  const [amountReceived, setAmountReceived] = useState<number>(5000);
  const [installmentCount, setInstallmentCount] = useState<number>(10);
  const [selectedInstallmentIds, setSelectedInstallmentIds] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Other'>('Cash');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [excessChoice, setExcessChoice] = useState<'next_due' | 'principal' | 'advance'>('next_due');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  const currentLoan = loans.find((l) => l.id === selectedLoanId);
  const currentCustomer = currentLoan ? customers.find((c) => c.id === currentLoan.customerId) : null;
  const loanInstallments = currentLoan
    ? installments.filter((i) => i.loanId === currentLoan.id).sort((a, b) => a.weekNumber - b.weekNumber)
    : [];

  const unpaidInstallments = loanInstallments.filter((i) => !i.isPaid);

  // When loan changes, initialize reasonable defaults
  useEffect(() => {
    if (currentLoan) {
      const due =
        currentLoan.loanType === 'daily_due'
          ? currentLoan.dailyDueAmount || 100
          : currentLoan.weeklyDueAmount || 500;
      setAmountReceived(due * Math.min(10, unpaidInstallments.length || 1));
      setInstallmentCount(Math.min(10, unpaidInstallments.length || 1));
      setSelectedInstallmentIds([]);
    }
  }, [selectedLoanId]);

  // When count changes in Method 2, update amountReceived
  useEffect(() => {
    if (inputMethod === 'count' && currentLoan) {
      const due =
        currentLoan.loanType === 'daily_due'
          ? currentLoan.dailyDueAmount || 100
          : currentLoan.weeklyDueAmount || 500;
      const count = Math.min(installmentCount, unpaidInstallments.length);
      const calculatedTotal = count * due;
      setAmountReceived(calculatedTotal);

      // Select first N unpaid installment IDs
      const targetIds = unpaidInstallments.slice(0, count).map((i) => i.id);
      setSelectedInstallmentIds(targetIds);
    }
  }, [installmentCount, inputMethod, selectedLoanId]);

  // Run allocation preview
  const effectiveAmount = Number(amountReceived) || 0;
  const allocationPreview = calculateMultipleDueAllocation(
    loanInstallments,
    effectiveAmount,
    selectedInstallmentIds.length > 0 ? selectedInstallmentIds : undefined
  );

  const coveredSummary = formatCoveredWeeksSummary(allocationPreview.coveredWeeks);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentLoan) return;
    if (effectiveAmount <= 0) {
      alert('Please enter a valid collection amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { payment, coveredWeeksText } = onCollectDues({
        loanId: currentLoan.id,
        amountReceived: effectiveAmount,
        paymentMethod,
        referenceNo,
        notes: notes || `Multiple Weekly Due (${coveredSummary})`,
        selectedInstallmentIds: selectedInstallmentIds.length > 0 ? selectedInstallmentIds : undefined,
        excessAllocation: excessChoice,
      });

      setSubmissionSuccess(`Successfully collected ${formatIndianCurrency(effectiveAmount)} for ${coveredWeeksText}!`);
      setTimeout(() => setSubmissionSuccess(null), 5000);

      // Show receipt immediately
      onViewReceipt(payment);
    } catch (err: any) {
      alert(err.message || 'Payment collection failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectInstallment = (id: string) => {
    if (selectedInstallmentIds.includes(id)) {
      setSelectedInstallmentIds(selectedInstallmentIds.filter((item) => item !== id));
    } else {
      setSelectedInstallmentIds([...selectedInstallmentIds, id]);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title */}
      <div className="p-6 rounded-2xl neon-card">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white font-display">
            Multiple Weekly Due Collection Desk
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Collect multiple weekly installments in a single visit with atomic allocation, penalty priority, and instant unified receipt.
        </p>
      </div>

      {submissionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{submissionSuccess}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Input Selection (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl neon-card p-6 space-y-5">
          
          {/* Select Loan */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 font-semibold uppercase tracking-wider font-mono">
              1. Select Borrower Loan Agreement
            </label>
            {installmentLoans.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs text-center space-y-1">
                <div className="font-semibold text-slate-300">No active installment loans found.</div>
                <div className="text-[11px] text-cyan-400">All data has been cleared. Issue a new loan to start collection.</div>
              </div>
            ) : (
              <select
                value={selectedLoanId}
                onChange={(e) => setSelectedLoanId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              >
                {installmentLoans.map((l) => {
                  const cust = customers.find((c) => c.id === l.customerId);
                  const dueText =
                    l.loanType === 'daily_due'
                      ? `${formatIndianCurrency(l.dailyDueAmount || 100)}/day (No Penalty)`
                      : `${formatIndianCurrency(l.weeklyDueAmount)}/wk`;
                  return (
                    <option key={l.id} value={l.id}>
                      {l.loanId} — {cust?.fullName} ({dueText}) · Out: {formatIndianCurrency(l.outstandingWeeklyDues)}
                    </option>
                  );
                })}
              </select>
            )}
          </div>

          {currentLoan && currentCustomer && (
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-3 gap-3 text-xs font-tabular">
              <div>
                <span className="text-[10px] text-slate-500 block">Borrower</span>
                <span className="font-bold text-white">{currentCustomer.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">
                  {currentLoan.loanType === 'daily_due' ? 'Daily Due' : 'Weekly Installment'}
                </span>
                <span className="font-bold text-cyan-300">
                  {formatIndianCurrency(
                    currentLoan.loanType === 'daily_due'
                      ? currentLoan.dailyDueAmount || 100
                      : currentLoan.weeklyDueAmount
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Unpaid Dues</span>
                <span className="font-bold text-amber-400">
                  {formatIndianCurrency(currentLoan.outstandingWeeklyDues)}
                </span>
              </div>
            </div>
          )}

          {/* Collection Methods (Method 1 or Method 2) */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wider font-mono">
              2. Choose Entry Method
            </label>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setInputMethod('amount')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  inputMethod === 'amount'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                <div className="font-bold">Method 1: Enter Total Amount</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Enter total cash received (e.g. ₹5,000)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setInputMethod('count')}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  inputMethod === 'count'
                    ? 'border-purple-400 bg-purple-950/40 text-purple-200'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                <div className="font-bold">Method 2: Select Installments Count</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Select number of weeks (e.g. 10 weeks)
                </div>
              </button>
            </div>
          </div>

          {/* Dynamic Input based on method */}
          {inputMethod === 'amount' ? (
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">
                Total Amount Received (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-cyan-400">₹</span>
                <input
                  type="number"
                  min={1}
                  step={50}
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-lg font-bold text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Example: If weekly due is ₹500, entering ₹5,000 settles 10 installments automatically.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-slate-400 mb-1 font-semibold">
                Number of Weekly Installments Being Paid *
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, unpaidInstallments.length)}
                  value={installmentCount}
                  onChange={(e) => setInstallmentCount(Number(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <span className="font-bold text-lg text-purple-300 font-tabular px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg">
                  {installmentCount} Wks
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-300">
                Calculated Total: <span className="font-bold font-tabular text-cyan-400">{formatIndianCurrency(amountReceived)}</span>
              </div>
            </div>
          )}

          {/* Installment Schedule Interactive Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-mono">
                Installment Breakdown & Selection
              </label>
              <span className="text-[10px] text-slate-500">Click to include/exclude specific weeks</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1">
              {loanInstallments.map((inst) => {
                const isCoveredInPreview = allocationPreview.coveredWeeks.includes(inst.weekNumber);
                const isSelectedByUser = selectedInstallmentIds.includes(inst.id);

                return (
                  <button
                    key={inst.id}
                    type="button"
                    disabled={inst.isPaid}
                    onClick={() => toggleSelectInstallment(inst.id)}
                    className={`p-2 rounded-lg text-left border text-xs transition-colors ${
                      inst.isPaid
                        ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                        : isCoveredInPreview
                        ? 'bg-cyan-950/60 border-cyan-400/80 text-cyan-200'
                        : isSelectedByUser
                        ? 'bg-purple-950/60 border-purple-400 text-purple-200'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">W{inst.weekNumber}</span>
                      {inst.isPaid ? (
                        <span className="text-[9px] text-emerald-400">Paid</span>
                      ) : inst.isOverdue ? (
                        <span className="text-[9px] text-rose-400">Late</span>
                      ) : null}
                    </div>
                    <div className="text-[11px] font-tabular mt-0.5">
                      {formatIndianCurrency(inst.amountDue)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Method & Reference */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Reference / UTR / Memo</label>
              <input
                type="text"
                placeholder="e.g. UPI489102849"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
              >
              </input>
            </div>
          </div>

          {/* Excess Amount Handling Modal Requirement */}
          {allocationPreview.remainingExcess > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Excess Amount Detected: {formatIndianCurrency(allocationPreview.remainingExcess)}</span>
              </div>
              <p className="text-[11px] text-amber-300/80">
                The amount received exceeds the selected installment dues. Please specify how the excess should be allocated:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setExcessChoice('next_due')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    excessChoice === 'next_due'
                      ? 'bg-amber-400 text-black'
                      : 'bg-slate-900 text-amber-200 border border-amber-500/30'
                  }`}
                >
                  Allocate to Next Weekly Due
                </button>
                <button
                  type="button"
                  onClick={() => setExcessChoice('principal')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    excessChoice === 'principal'
                      ? 'bg-amber-400 text-black'
                      : 'bg-slate-900 text-amber-200 border border-amber-500/30'
                  }`}
                >
                  Reduce Principal
                </button>
                <button
                  type="button"
                  onClick={() => setExcessChoice('advance')}
                  className={`px-2.5 py-1 rounded text-xs font-semibold ${
                    excessChoice === 'advance'
                      ? 'bg-amber-400 text-black'
                      : 'bg-slate-900 text-amber-200 border border-amber-500/30'
                  }`}
                >
                  Hold as Customer Advance
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Right: Allocation Preview & Save Submission (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl neon-card p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Real-Time Allocation Preview
              </span>
              <h3 className="text-lg font-bold text-white font-display mt-0.5">
                Receipt Summary
              </h3>
            </div>

            {/* Allocation breakdown box */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Covered Installments:</span>
                <span className="font-bold text-cyan-300 font-mono">{coveredSummary}</span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 font-tabular">
                <span className="text-slate-400">Weekly Dues Settled:</span>
                <span className="font-bold text-white">
                  {formatIndianCurrency(allocationPreview.totalDuePaid)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 font-tabular">
                <span className="text-slate-400">Penalties Cleared:</span>
                <span className="font-bold text-emerald-400">
                  {formatIndianCurrency(allocationPreview.totalPenaltyPaid)}
                </span>
              </div>

              <div className="flex justify-between items-center py-1.5 border-b border-slate-800 font-tabular">
                <span className="text-slate-400">Excess / Advance:</span>
                <span className="font-bold text-amber-400">
                  {formatIndianCurrency(allocationPreview.remainingExcess)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-center space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-semibold block">
                  Total Expected Payment
                </span>
                <span className="text-2xl font-extrabold text-cyan-400 font-tabular">
                  {formatIndianCurrency(effectiveAmount, true)}
                </span>
              </div>
            </div>

            {/* Note on Idempotency */}
            <p className="text-[11px] text-slate-500 leading-tight">
              A unique receipt number (e.g. RCP-2026-XXX) and cryptographic idempotency key will be assigned. All updates commit atomically.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || effectiveAmount <= 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 font-bold text-sm text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
            >
              <Receipt className="w-4 h-4" />
              {isSubmitting ? 'Recording & Printing...' : `Collect ${formatIndianCurrency(effectiveAmount)} & Issue Receipt`}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
