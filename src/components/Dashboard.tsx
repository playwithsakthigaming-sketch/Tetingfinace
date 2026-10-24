/**
 * Sri Sennamal Finance — Central Financial Dashboard
 * Pixel-accurate implementation matching the user reference screenshot.
 * Displays Financial Health & Collections Summary grid, Active Loan Book,
 * and Recent Verified Collections with live interactive handlers.
 */

import React, { useState } from 'react';
import {
  Users,
  FileText,
  Link as LinkIcon,
  TrendingUp,
  CheckCircle2,
  Clock,
  Percent,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Search,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { Customer, Installment, Loan, Payment, Refund } from '../types/finance';
import { formatIndianCurrency } from '../utils/financeCalculations';

interface DashboardProps {
  customers: Customer[];
  loans: Loan[];
  installments: Installment[];
  payments: Payment[];
  refunds: Refund[];
  onOpenPaymentModal: (loanId?: string) => void;
  onOpenMultipleDue: (loanId?: string) => void;
  onOpenNewLoan: () => void;
  onOpenNewCustomer: () => void;
  onSelectTab: (tab: string) => void;
  onRunPenaltyCheck: () => void;
  onViewReceipt: (payment: Payment) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  customers,
  loans,
  installments,
  payments,
  refunds,
  onOpenPaymentModal,
  onOpenMultipleDue,
  onSelectTab,
  onRunPenaltyCheck,
  onViewReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loanTypeFilter, setLoanTypeFilter] = useState('all');
  const [penaltyMessage, setPenaltyMessage] = useState<string | null>(null);

  // Exact calculations from live store
  const totalCustomers = customers.length;
  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue').length;
  const principalOutstanding = loans.reduce((sum, l) => sum + (l.outstandingPrincipal || 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCollections = payments
    .filter((p) => p.paymentDate && p.paymentDate.startsWith(todayStr))
    .reduce((sum, p) => sum + p.amount, 0);

  const weeklyDuesCollected = payments.reduce((sum, p) => sum + (p.allocations?.weeklyDue || 0), 0);
  const weeklyDuesPending = loans.reduce((sum, l) => sum + (l.outstandingWeeklyDues || 0), 0);

  const interestCollected = payments.reduce((sum, p) => sum + (p.allocations?.interest || 0), 0);
  const interestOutstanding = loans.reduce((sum, l) => sum + (l.outstandingInterest || 0), 0);

  const penaltiesCollected = payments.reduce((sum, p) => sum + (p.allocations?.penalty || 0), 0);
  const penaltiesOutstanding = loans.reduce((sum, l) => sum + (l.outstandingPenalties || 0), 0);

  const refundsIssued = refunds.reduce((sum, r) => sum + r.amount, 0);
  const totalGrossPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const netCollections = totalGrossPayments - refundsIssued;

  const overdueCount = installments.filter((i) => i.isOverdue && !i.isPaid).length;

  const handleEvaluatePenalties = () => {
    onRunPenaltyCheck();
    setPenaltyMessage('Wednesday late penalties successfully evaluated and applied according to Tamil Nadu rules.');
    setTimeout(() => setPenaltyMessage(null), 4000);
  };

  // Filter Loans table
  const filteredLoans = loans.filter((l) => {
    const cust = customers.find((c) => c.id === l.customerId);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      l.loanId.toLowerCase().includes(q) ||
      (cust && cust.fullName.toLowerCase().includes(q)) ||
      (cust && cust.phone.includes(q));

    if (!matchesSearch) return false;

    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (loanTypeFilter !== 'all' && l.loanType !== loanTypeFilter) return false;

    return true;
  });

  return (
    <div className="space-y-5 pb-24">
      
      {/* 1. Hero Context Card matching screenshot */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#08101e] border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-white font-display">
              Sri Sennamal Finance
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 font-mono">
              Live DB Ledger
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 leading-snug">
            Weekly Loan Collections · Coimbatore, Tamil Nadu · Currency: ₹ (INR) · Timezone: Asia/Kolkata
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Evaluate Wednesday Penalties Button */}
          <button
            onClick={handleEvaluatePenalties}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-[#16122d] hover:bg-[#201844] border border-purple-500/40 rounded-xl transition-colors whitespace-nowrap shadow-[0_0_12px_rgba(168,85,247,0.15)]"
          >
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Evaluate Wednesday Penalties</span>
          </button>

          {/* Record Collection Button */}
          <button
            onClick={() => onOpenPaymentModal()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0084ff] hover:bg-[#0070da] rounded-xl transition-colors whitespace-nowrap shadow-[0_0_15px_rgba(0,132,255,0.35)]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Record Collection</span>
          </button>
        </div>
      </div>

      {penaltyMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{penaltyMessage}</span>
        </div>
      )}

      {/* 2. FINANCIAL HEALTH & COLLECTIONS SUMMARY */}
      <div>
        <div className="flex items-center justify-between mb-2.5 text-xs">
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-400 font-semibold">
            FINANCIAL HEALTH & COLLECTIONS SUMMARY
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Asia/Kolkata Date: 2026-10-23
          </span>
        </div>

        {/* 4x3 Grid + Overdue Box */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          
          {/* Row 1, Col 1: Total Customers */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-cyan-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Total Customers</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white font-tabular mt-1.5">{totalCustomers}</div>
            <div className="text-[11px] text-slate-400 mt-1">Active accounts</div>
          </div>

          {/* Row 1, Col 2: Active Loans */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-blue-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Active Loans</span>
              <FileText className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white font-tabular mt-1.5">{activeLoans}</div>
            <div className="text-[11px] text-slate-400 mt-1">Weekly & SP contracts</div>
          </div>

          {/* Row 1, Col 3: Principal Outstanding */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-purple-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Principal Outstanding</span>
              <LinkIcon className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white font-tabular mt-1.5">
              {formatIndianCurrency(principalOutstanding)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Disbursed balance</div>
          </div>

          {/* Row 1, Col 4: Today's Collections */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-emerald-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Today's Collections</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-tabular mt-1.5">
              {formatIndianCurrency(todayCollections)}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">Received today</div>
          </div>

          {/* Row 2, Col 1: Weekly Dues Collected */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-cyan-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Weekly Dues Collected</span>
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-400 font-tabular mt-1.5">
              {formatIndianCurrency(weeklyDuesCollected)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Total installments paid</div>
          </div>

          {/* Row 2, Col 2: Weekly Dues Pending */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-amber-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Weekly Dues Pending</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400 font-tabular mt-1.5">
              {formatIndianCurrency(weeklyDuesPending)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Scheduled installments</div>
          </div>

          {/* Row 2, Col 3: Interest Collected */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-cyan-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Interest Collected</span>
              <Percent className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-400 font-tabular mt-1.5">
              {formatIndianCurrency(interestCollected)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">SP Loan monthly/weekly interest</div>
          </div>

          {/* Row 2, Col 4: Interest Outstanding */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-purple-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Interest Outstanding</span>
              <Percent className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white font-tabular mt-1.5">
              {formatIndianCurrency(interestOutstanding)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Unpaid accrued interest</div>
          </div>

          {/* Row 3, Col 1: Penalties Collected */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-cyan-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Penalties Collected</span>
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white font-tabular mt-1.5">
              {formatIndianCurrency(penaltiesCollected)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Charges received</div>
          </div>

          {/* Row 3, Col 2: Penalties Outstanding */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-rose-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Penalties Outstanding</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400 font-tabular mt-1.5">
              {formatIndianCurrency(penaltiesOutstanding)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Unpaid late fees</div>
          </div>

          {/* Row 3, Col 3: Refunds Issued */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-purple-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Refunds Issued</span>
              <RotateCcw className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white font-tabular mt-1.5">
              {formatIndianCurrency(refundsIssued)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Reversals & corrections</div>
          </div>

          {/* Row 3, Col 4: Net Collections */}
          <div className="p-4 rounded-xl bg-[#08101e] border border-slate-800/80 relative hover:border-cyan-500/30 transition-colors">
            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-400 font-medium">Net Collections</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-300 font-tabular mt-1.5">
              {formatIndianCurrency(netCollections)}
            </div>
            <div className="text-[11px] text-cyan-400 mt-1">Gross minus refunds</div>
          </div>

          {/* Row 4: Overdue Installments (Dark Plum / Crimson card) */}
          <div className="p-4 rounded-xl bg-[#1c0d16] border border-rose-900/60 relative col-span-2 lg:col-span-1">
            <div className="flex items-start justify-between">
              <span className="text-xs text-rose-300 font-medium">Overdue Installments</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white font-tabular mt-1.5">{overdueCount}</div>
            <div className="text-[11px] text-rose-400/90 mt-1">Past Wednesday penalty day</div>
          </div>

        </div>
      </div>

      {/* 3. Active Loan Book & Weekly Schedules Card matching screenshot */}
      <div className="rounded-2xl bg-[#08101e] border border-slate-800/80 p-5 shadow-xl space-y-4">
        
        {/* Card Header & Filter Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              Active Loan Book & Weekly Schedules
            </h2>
            <p className="text-xs text-slate-400">
              Real-time independent ledger balances per loan. Never mixed across separate loans.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, loan ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-[#0b1426] border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-52"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0b1426] border border-slate-700/80 rounded-lg text-xs text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Settled</option>
            </select>

            <select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[#0b1426] border border-slate-700/80 rounded-lg text-xs text-slate-200"
            >
              <option value="all">All Loan Types</option>
              <option value="standard_weekly">Weekly</option>
              <option value="sp_interest_only">SP (Interest Only)</option>
            </select>
          </div>
        </div>

        {/* Table matching screenshot */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                <th className="py-2.5 px-3">LOAN ID</th>
                <th className="py-2.5 px-3">CUSTOMER</th>
                <th className="py-2.5 px-3">TYPE</th>
                <th className="py-2.5 px-3">PRINCIPAL</th>
                <th className="py-2.5 px-3">WEEKLY DUE</th>
                <th className="py-2.5 px-3">OUTSTANDING DUES</th>
                <th className="py-2.5 px-3">PENALTY</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3 text-center">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-tabular">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-medium text-xs">
                    No loan contracts found. Issue a new customer loan to get started.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((l) => {
                  const cust = customers.find((c) => c.id === l.customerId);
                  const isSettled = l.status === 'completed';

                  return (
                    <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {l.loanId}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{cust?.fullName || 'Customer'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{cust?.phone}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {l.loanType === 'sp_interest_only' ? 'SP (2% / mo)' : `Weekly (${l.tenureWeeks} wks)`}
                      </td>

                      <td className="py-3 px-3 text-slate-200">
                        {formatIndianCurrency(l.originalPrincipal)}
                      </td>

                      <td className="py-3 px-3 text-slate-200">
                        {l.weeklyDueAmount > 0 ? formatIndianCurrency(l.weeklyDueAmount) : '—'}
                      </td>

                      <td className="py-3 px-3 font-bold text-amber-400">
                        {formatIndianCurrency(l.outstandingWeeklyDues)}
                      </td>

                      <td className="py-3 px-3 font-bold">
                        {l.outstandingPenalties > 0 ? (
                          <span className="text-rose-400">{formatIndianCurrency(l.outstandingPenalties)}</span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {isSettled ? (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            Settled
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 text-emerald-400 border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => {
                            if (l.loanType === 'standard_weekly') {
                              onOpenMultipleDue(l.id);
                            } else {
                              onOpenPaymentModal(l.id);
                            }
                          }}
                          className="px-3 py-1 text-xs font-semibold text-slate-200 bg-[#0e172a] hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-400 rounded-lg transition-colors whitespace-nowrap"
                        >
                          Collect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Recent Verified Collections Card matching screenshot */}
      <div className="rounded-2xl bg-[#08101e] border border-slate-800/80 p-5 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/70">
          <h2 className="text-base font-bold text-white font-display">
            Recent Verified Collections
          </h2>

          <button
            onClick={() => onSelectTab('ledger')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            Full Ledger →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase font-mono tracking-wider text-slate-400">
                <th className="py-2.5 px-3">RECEIPT NO</th>
                <th className="py-2.5 px-3">DATE & TIME</th>
                <th className="py-2.5 px-3">LOAN ID</th>
                <th className="py-2.5 px-3">COLLECTOR (AUTO-ID)</th>
                <th className="py-2.5 px-3">DUE COVERED</th>
                <th className="py-2.5 px-3">METHOD</th>
                <th className="py-2.5 px-3 text-right">AMOUNT RECEIVED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-tabular">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium text-xs">
                    No verified collections recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const targetLoan = loans.find((l) => l.id === p.loanId);
                  const coveredText = p.allocations?.coveredWeeks && p.allocations.coveredWeeks.length > 0
                    ? `Week ${p.allocations.coveredWeeks[0]}–${p.allocations.coveredWeeks[p.allocations.coveredWeeks.length - 1]}`
                    : 'Weekly Due';

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onViewReceipt(p)}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {p.receiptNo}
                      </td>

                      <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                        {new Date(p.paymentDate).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-200">
                        {targetLoan?.loanId || p.loanId}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">K. Sakthi Kumar</div>
                        <div className="text-[10px] text-slate-400 font-mono">STAFF-AGENT-01</div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-500/40">
                          {coveredText}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {p.paymentMethod}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {formatIndianCurrency(p.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
