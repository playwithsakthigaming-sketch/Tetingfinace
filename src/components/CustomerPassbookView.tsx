/**
 * Sri Sennamal Finance — Public Customer Loan Passbook
 * Self-service public view accessed via ?track=TOKEN or #track=TOKEN.
 * Zero login required for the customer.
 * Strictly isolated: displays ONLY the selected loan and borrower's own schedule.
 */

import React from 'react';
import {
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Coins,
  Phone,
  MapPin,
  Lock,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { PassbookData } from '../types/finance';
import { formatIndianCurrency } from '../utils/financeCalculations';

interface CustomerPassbookViewProps {
  passbookData: PassbookData | null;
  tokenRevokedOrInvalid: boolean;
  onExitToPortal?: () => void;
}

export const CustomerPassbookView: React.FC<CustomerPassbookViewProps> = ({
  passbookData,
  tokenRevokedOrInvalid,
  onExitToPortal,
}) => {
  if (tokenRevokedOrInvalid || !passbookData) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#0c1322] border border-rose-500/30 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white font-display">Passbook Link Revoked or Invalid</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            This customer passbook tracking link has been revoked, expired, or was entered incorrectly.
            To protect your financial privacy, passbook links are individual and revocable.
          </p>
          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Sri Sennamal Finance</p>
            <p>Phone: 7812834522 · Coimbatore, Tamil Nadu</p>
            <p className="text-[11px] text-slate-500">Contact our office for a new verified tracking link.</p>
          </div>
          {onExitToPortal && (
            <button
              onClick={onExitToPortal}
              className="mt-4 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Back to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const { customerName, loan, installments, payments, outstandingBalance, businessInfo } = passbookData;

  const totalDuesDue = installments.reduce((sum, i) => sum + i.amountDue, 0);
  const totalDuesPaid = installments.reduce((sum, i) => sum + i.amountPaid, 0);
  const paidCount = installments.filter((i) => i.isPaid).length;
  const partialCount = installments.filter((i) => !i.isPaid && i.amountPaid > 0).length;
  const overdueCount = installments.filter((i) => i.isOverdue && !i.isPaid).length;
  const pendingCount = installments.filter((i) => !i.isPaid && !i.isOverdue).length;

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Passbook Header Card */}
        <div className="p-6 rounded-2xl neon-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-900 to-purple-950 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center text-cyan-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white font-display">
                  {businessInfo.companyName}
                </h1>
                <p className="text-xs text-slate-400">
                  {businessInfo.address} · Helpline: {businessInfo.phone}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 text-xs font-semibold text-cyan-300 bg-cyan-950/60 rounded-full border border-cyan-500/30">
                Official Digital Passbook
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {businessInfo.licenceNumber}
              </p>
            </div>
          </div>

          {/* Borrower & Selected Loan Info (Strictly isolated to this loan) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-5 text-xs font-tabular">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Borrower Name</span>
              <span className="text-base font-bold text-white">{customerName}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Loan ID</span>
              <span className="text-base font-mono font-bold text-cyan-400">{loan.loanId}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Weekly Installment</span>
              <span className="text-base font-bold text-slate-200">
                {formatIndianCurrency(loan.weeklyDueAmount)} / Sun
              </span>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <span className="text-[10px] text-cyan-300 uppercase tracking-wider block font-semibold">
                Total Outstanding
              </span>
              <span className="text-lg font-bold text-cyan-300">
                {formatIndianCurrency(outstandingBalance)}
              </span>
            </div>
          </div>

          {/* Balance breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] font-tabular">
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Principal Out.</span>
              <span className="font-semibold text-slate-200">{formatIndianCurrency(loan.outstandingPrincipal)}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Weekly Dues Out.</span>
              <span className="font-semibold text-amber-400">{formatIndianCurrency(loan.outstandingWeeklyDues)}</span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Interest Paid/Due</span>
              <span className="font-semibold text-purple-300">
                {formatIndianCurrency(loan.totalPaidInterest)} / {formatIndianCurrency(loan.outstandingInterest)}
              </span>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block">Penalties Paid/Due</span>
              <span className="font-semibold text-rose-400">
                {formatIndianCurrency(loan.totalPaidPenalties)} / {formatIndianCurrency(loan.outstandingPenalties)}
              </span>
            </div>
          </div>
        </div>

        {/* Weekly Installment Schedule */}
        <div className="rounded-2xl neon-card p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Weekly Installment Schedule & Settlement Status
              </h2>
              <p className="text-xs text-slate-400">
                Sunday due dates with Wednesday late penalty rules.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {paidCount} Paid
              </span>
              {partialCount > 0 && (
                <span className="flex items-center gap-1 text-cyan-400">
                  <Clock className="w-3.5 h-3.5" /> {partialCount} Partial
                </span>
              )}
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" /> {overdueCount} Overdue
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-400">
                <Calendar className="w-3.5 h-3.5" /> {pendingCount} Pending
              </span>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Week</th>
                  <th className="py-2.5 px-3">Due Date (Sunday)</th>
                  <th className="py-2.5 px-3">Due Amount</th>
                  <th className="py-2.5 px-3">Amount Paid</th>
                  <th className="py-2.5 px-3">Penalty (₹150)</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-tabular">
                {installments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-white">
                      Week {inst.weekNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {new Date(inst.dueDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {formatIndianCurrency(inst.amountDue)}
                    </td>
                    <td className="py-3 px-3 font-bold text-cyan-300">
                      {formatIndianCurrency(inst.amountPaid)}
                    </td>
                    <td className="py-3 px-3 text-rose-400">
                      {inst.penaltyAssessed > 0 ? (
                        <span>
                          {formatIndianCurrency(inst.penaltyAssessed)}
                          {inst.penaltyPaid >= inst.penaltyAssessed && (
                            <span className="text-emerald-400 text-[10px] ml-1">(Paid)</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {inst.isPaid ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          Paid
                        </span>
                      ) : inst.isOverdue ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-500/30">
                          Overdue (Late Fee)
                        </span>
                      ) : inst.amountPaid > 0 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                          Partial ({formatIndianCurrency(inst.amountPaid)})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment History for this Loan */}
        <div className="rounded-2xl neon-card p-6">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-white font-display">
              Verified Payment Receipts ({payments.length})
            </h2>
            <p className="text-xs text-slate-400">
              Payments officially recorded with Sri Sennamal Finance.
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No payments recorded yet for this loan.
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Receipt No</th>
                    <th className="py-2.5 px-3">Payment Date</th>
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Covered Dues</th>
                    <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-tabular">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {p.receiptNo}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-purple-300">
                        {p.notes || 'Weekly Dues'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {formatIndianCurrency(p.amount, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="text-center text-xs text-slate-500 space-y-1 pb-6">
          <p>Sri Sennamal Finance · Dedicated Weekly Finance Services · Coimbatore</p>
          <p className="text-[11px]">This page is for informational tracking and reflects verified ledger records.</p>
        </div>

      </div>
    </div>
  );
};
