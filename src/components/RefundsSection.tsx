/**
 * Sri Sennamal Finance — Dedicated Refund Management
 * Traceable, separate refund transactions linked to original payments.
 * Enforces partial/full refund limits, audit logging, and ledger debit entries.
 */

import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle,
  AlertTriangle,
  Receipt,
  ShieldAlert,
  ArrowRight,
  X,
} from 'lucide-react';
import { Customer, Loan, Payment, Refund } from '../types/finance';
import { formatIndianCurrency } from '../utils/financeCalculations';

interface RefundsSectionProps {
  payments: Payment[];
  refunds: Refund[];
  loans: Loan[];
  customers: Customer[];
  onIssueRefund: (params: {
    originalPaymentId: string;
    amount: number;
    reason: string;
    paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
    referenceNo?: string;
  }) => Refund;
}

export const RefundsSection: React.FC<RefundsSectionProps> = ({
  payments,
  refunds,
  loans,
  customers,
  onIssueRefund,
}) => {
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('Excess payment returned to customer');
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Other'>('Cash');
  const [refundReference, setRefundReference] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedPayment = payments.find((p) => p.id === selectedPaymentId) || null;
  const selectedLoan = selectedPayment ? loans.find((l) => l.id === selectedPayment.loanId) : null;
  const selectedCustomer = selectedPayment ? customers.find((c) => c.id === selectedPayment.customerId) : null;
  const remainingRefundable = selectedPayment ? selectedPayment.amount - selectedPayment.refundedAmount : 0;

  const handleOpenRefundModal = (payment: Payment) => {
    setSelectedPaymentId(payment.id);
    const maxRefund = payment.amount - payment.refundedAmount;
    setRefundAmount(maxRefund);
    setRefundReference(`REFUND-REF-${Date.now().toString().slice(-6)}`);
    setErrorMsg(null);
    setIsConfirmOpen(true);
  };

  const handleExecuteRefund = () => {
    if (!selectedPayment) return;
    if (refundAmount <= 0) {
      setErrorMsg('Refund amount must be greater than zero.');
      return;
    }
    if (refundAmount > remainingRefundable) {
      setErrorMsg(`Cannot refund more than remaining balance of ₹${remainingRefundable}.`);
      return;
    }

    try {
      const refund = onIssueRefund({
        originalPaymentId: selectedPayment.id,
        amount: Number(refundAmount),
        reason: refundReason,
        paymentMethod: refundMethod,
        referenceNo: refundReference,
      });

      setSuccessMsg(`Refund of ${formatIndianCurrency(refund.amount)} successfully processed for ${refund.receiptNo}.`);
      setIsConfirmOpen(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Refund processing failed.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="p-6 rounded-2xl neon-card">
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-bold text-white font-display">
            Refunds & Dispute Adjustments
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Issue full or partial refunds linked to verified receipts. Preserves original payments and maintains immutable audit logs.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Refundable Payments & Issued Refunds Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Eligible Payments List (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl neon-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Receipts Eligible for Refund
            </span>
            <span className="text-[11px] text-slate-500">Only remaining refundable portions allowed</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Orig. Amount</th>
                  <th className="py-2.5 px-3">Refunded</th>
                  <th className="py-2.5 px-3">Available</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-tabular">
                {payments.map((p) => {
                  const cust = customers.find((c) => c.id === p.customerId);
                  const available = p.amount - p.refundedAmount;
                  const isFullyRefunded = available <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {p.receiptNo}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {cust?.fullName || 'Customer'}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {formatIndianCurrency(p.amount)}
                      </td>
                      <td className="py-3 px-3 text-orange-400">
                        {formatIndianCurrency(p.refundedAmount)}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400">
                        {formatIndianCurrency(available)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isFullyRefunded ? (
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">Fully Refunded</span>
                        ) : (
                          <button
                            onClick={() => handleOpenRefundModal(p)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-orange-400 hover:text-black hover:bg-orange-400 rounded transition-colors border border-orange-500/30"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Issued Refunds History (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl neon-card p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              Issued Refunds Audit Trail ({refunds.length})
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Net collections are automatically reduced by all confirmed refunds.
            </p>
          </div>

          {refunds.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No refunds have been issued.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {refunds.map((r) => {
                const targetLoan = loans.find((l) => l.id === r.loanId);
                const targetCust = customers.find((c) => c.id === r.customerId);

                return (
                  <div key={r.id} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-orange-400">
                        Refund against {r.receiptNo}
                      </span>
                      <span className="font-bold text-white font-tabular">
                        -{formatIndianCurrency(r.amount, true)}
                      </span>
                    </div>

                    <div className="text-slate-300 text-[11px]">
                      <span className="font-semibold text-white">{targetCust?.fullName}</span> · Loan: {targetLoan?.loanId || r.loanId}
                    </div>

                    <div className="p-2 rounded bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400">
                      Reason: <span className="text-slate-200">{r.reason}</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Method: {r.paymentMethod}</span>
                      <span>{new Date(r.refundDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* --- REFUND CONFIRMATION MODAL --- */}
      {isConfirmOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0c1322] border border-orange-500/40 rounded-2xl shadow-2xl p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-bold text-white font-display">Confirm Payment Refund</h3>
              </div>
              <button onClick={() => setIsConfirmOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            <div className="mt-4 space-y-4 text-xs">
              
              {/* Target Receipt Info */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Receipt No:</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedPayment.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Borrower:</span>
                  <span className="font-semibold text-white">{selectedCustomer?.fullName}</span>
                </div>
                <div className="flex justify-between font-tabular">
                  <span className="text-slate-400">Original Amount:</span>
                  <span className="text-white">{formatIndianCurrency(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between font-tabular font-bold">
                  <span className="text-slate-400">Max Refundable:</span>
                  <span className="text-emerald-400">{formatIndianCurrency(remainingRefundable)}</span>
                </div>
              </div>

              {/* Refund Input */}
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Refund Amount (₹) *</label>
                <input
                  type="number"
                  min={1}
                  max={remainingRefundable}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-base font-bold focus:outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Refund Reason *</label>
                <select
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="Excess payment returned to customer">Excess payment returned to customer</option>
                  <option value="Duplicate entry correction">Duplicate entry correction</option>
                  <option value="Disputed weekly due settlement">Disputed weekly due settlement</option>
                  <option value="Loan settlement balance refund">Loan settlement balance refund</option>
                  <option value="Other">Other authorized refund reason</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Refund Method</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Reference No</label>
                  <input
                    type="text"
                    value={refundReference}
                    onChange={(e) => setRefundReference(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              {/* Warning note */}
              <p className="text-[11px] text-amber-300/80 leading-relaxed bg-amber-950/20 p-2.5 rounded border border-amber-500/20">
                Notice: The original payment record will not be deleted. A separate refund transaction will be appended to the loan ledger and deducted from net collection reports.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConfirmOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRefund}
                  className="px-4 py-2 font-semibold text-black bg-orange-400 hover:bg-orange-300 rounded-lg shadow"
                >
                  Confirm & Finalize Refund
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
