/**
 * Sri Sennamal Finance — Loan Management
 * Separate loan balances, Standard Weekly vs SP Interest-only loans,
 * Sunday due schedule creation, and isolated financial tracking.
 */

import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  Coins,
  Receipt,
  ExternalLink,
  X,
} from 'lucide-react';
import { Customer, CustomerAccessToken, Loan } from '../types/finance';
import { formatIndianCurrency } from '../utils/financeCalculations';

interface LoanManagementProps {
  loans: Loan[];
  customers: Customer[];
  tokens: CustomerAccessToken[];
  onCreateLoan: (params: {
    customerId: string;
    loanType: 'standard_weekly' | 'daily_due' | 'sp_interest_only';
    originalPrincipal: number;
    actualDisbursement: number;
    weeklyDueAmount?: number;
    dailyDueAmount?: number;
    loanStartDate: string;
    tenureWeeks?: number;
    tenureDays?: number;
    spFrequency?: 'weekly' | 'monthly';
    interestMethod?: 'flat' | 'reducing' | 'monthly_fixed';
    interestRateMonthly?: number;
    interestRateWeekly?: number;
    principalRepaymentTerms?: string;
  }) => void;
  onOpenPayment: (loanId: string) => void;
  onOpenMultipleDue: (loanId: string) => void;
  onOpenPassbookInApp: (tokenStr: string) => void;
}

export const LoanManagement: React.FC<LoanManagementProps> = ({
  loans,
  customers,
  tokens,
  onCreateLoan,
  onOpenPayment,
  onOpenMultipleDue,
  onOpenPassbookInApp,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'active' | 'overdue' | 'completed' | 'sp' | 'daily'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loanType, setLoanType] = useState<'standard_weekly' | 'daily_due' | 'sp_interest_only'>('sp_interest_only');
  const [principal, setPrincipal] = useState(10000);
  const [upfrontDeduction, setUpfrontDeduction] = useState(1000);
  const [weeklyDue, setWeeklyDue] = useState(1000);
  const [tenureWeeks, setTenureWeeks] = useState(10);
  const [dailyDue, setDailyDue] = useState(100);
  const [tenureDays, setTenureDays] = useState(100);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // SP Loan Frequency (Weekly vs Monthly) & Speed Vatti Amount
  const [spFrequency, setSpFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [spWeeklyAmount, setSpWeeklyAmount] = useState(1000);
  const [spRateMonthly, setSpRateMonthly] = useState(2.0);
  const [loanNotes, setLoanNotes] = useState('Speed Interest (SP) Loan - ₹1,000/week speed interest');
  const [showSchedulePreview, setShowSchedulePreview] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredLoans = loans.filter((l) => {
    const cust = customers.find((c) => c.id === l.customerId);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      l.loanId.toLowerCase().includes(q) ||
      (cust && cust.fullName.toLowerCase().includes(q)) ||
      (cust && cust.phone.includes(q));

    if (!matchesSearch) return false;

    if (filterType === 'active') return l.status === 'active';
    if (filterType === 'overdue') return l.status === 'overdue';
    if (filterType === 'completed') return l.status === 'completed';
    if (filterType === 'sp') return l.loanType === 'sp_interest_only';
    if (filterType === 'daily') return l.loanType === 'daily_due';
    return true;
  });

  const netDisbursed = Math.max(0, principal - upfrontDeduction);

  const handleCreateLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setFormError('Please select a customer for this loan.');
      return;
    }
    if (principal <= 0) {
      setFormError('Principal amount must be greater than zero.');
      return;
    }
    if (loanType === 'standard_weekly' && weeklyDue <= 0) {
      setFormError('Weekly due amount must be greater than zero.');
      return;
    }
    if (loanType === 'daily_due' && dailyDue <= 0) {
      setFormError('Daily due amount must be greater than zero.');
      return;
    }

    const calculatedWeeklyRate = principal > 0 ? (spWeeklyAmount / principal) * 100 : 10;

    onCreateLoan({
      customerId: selectedCustomerId,
      loanType,
      originalPrincipal: Number(principal),
      actualDisbursement: Number(netDisbursed),
      weeklyDueAmount: loanType === 'standard_weekly' ? Number(weeklyDue) : 0,
      dailyDueAmount: loanType === 'daily_due' ? Number(dailyDue) : 0,
      loanStartDate: startDate,
      tenureWeeks: Number(tenureWeeks),
      tenureDays: Number(tenureDays),
      spFrequency,
      interestMethod: loanType === 'sp_interest_only' ? 'monthly_fixed' : 'flat',
      interestRateMonthly: loanType === 'sp_interest_only' ? Number(spRateMonthly) : 0,
      interestRateWeekly: loanType === 'sp_interest_only' ? Number(calculatedWeeklyRate) : 0,
      principalRepaymentTerms: loanNotes || `Upfront deduction: ₹${upfrontDeduction}`,
    });

    setIsNewLoanOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl neon-card">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Loan Portfolio Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual weekly loans and SP loans. Balances are strictly isolated per loan agreement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Loan ID or borrower..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-56 sm:w-64"
            />
          </div>
          <button
            onClick={() => {
              setFormError(null);
              setIsNewLoanOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Issue New Loan
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterType('all')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            filterType === 'all'
              ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          All Loans ({loans.length})
        </button>
        <button
          onClick={() => setFilterType('active')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            filterType === 'active'
              ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Active Weekly ({loans.filter((l) => l.status === 'active' && l.loanType === 'standard_weekly').length})
        </button>
        <button
          onClick={() => setFilterType('overdue')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            filterType === 'overdue'
              ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Overdue ({loans.filter((l) => l.status === 'overdue').length})
        </button>
        <button
          onClick={() => setFilterType('sp')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            filterType === 'sp'
              ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          SP Loans ({loans.filter((l) => l.loanType === 'sp_interest_only').length})
        </button>
        <button
          onClick={() => setFilterType('daily')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            filterType === 'daily'
              ? 'bg-amber-950/60 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Day Due · No Penalty ({loans.filter((l) => l.loanType === 'daily_due').length})
        </button>
        <button
          onClick={() => setFilterType('completed')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            filterType === 'completed'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Closed / Fully Settled ({loans.filter((l) => l.status === 'completed').length})
        </button>
      </div>

      {/* Loans Grid / Cards */}
      {filteredLoans.length === 0 ? (
        <div className="rounded-2xl neon-card p-12 text-center text-slate-400 text-xs space-y-2">
          <p className="text-sm font-semibold text-slate-300">No active loans found on record.</p>
          <p className="text-slate-500">
            Click "+ Issue New Loan" to create an agreement or reset with demo data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLoans.map((l) => {
          const cust = customers.find((c) => c.id === l.customerId);
          const activeToken = tokens.find((t) => t.loanId === l.id && !t.isRevoked);

          return (
            <div key={l.id} className="rounded-2xl neon-card p-5 space-y-4 flex flex-col justify-between">
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="font-mono text-sm font-bold text-cyan-400 block">
                      {l.loanId}
                    </span>
                    <span className="text-xs font-semibold text-white mt-0.5 block">
                      {cust?.fullName || 'Unknown Customer'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {cust?.phone}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                      l.status === 'active'
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                        : l.status === 'overdue'
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {l.status}
                  </span>
                </div>

                {/* Terms Badge */}
                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Loan Type:</span>
                  <span className={`font-semibold ${
                    l.loanType === 'daily_due'
                      ? 'text-amber-400'
                      : l.loanType === 'sp_interest_only'
                      ? 'text-purple-300'
                      : 'text-cyan-300'
                  }`}>
                    {l.loanType === 'daily_due'
                      ? `Day Due · No Penalty (${l.tenureDays || 100} Days)`
                      : l.loanType === 'sp_interest_only'
                      ? `SP Loan (${l.spFrequency === 'weekly' ? `${l.interestRateWeekly || 0.5}% / Wk` : `${l.interestRateMonthly}% / Mo`})`
                      : `Weekly (${l.tenureWeeks} Weeks)`}
                  </span>
                </div>

                {/* Balances Breakdown (Separated strictly per loan) */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-tabular">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Original Principal</span>
                    <span className="font-bold text-white">
                      {formatIndianCurrency(l.originalPrincipal)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Principal Out.</span>
                    <span className="font-bold text-blue-400">
                      {formatIndianCurrency(l.outstandingPrincipal)}
                    </span>
                  </div>

                  {l.loanType === 'standard_weekly' ? (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Weekly Due</span>
                        <span className="font-bold text-slate-200">
                          {formatIndianCurrency(l.weeklyDueAmount)} / Sun
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Dues Remaining</span>
                        <span className="font-bold text-amber-400">
                          {formatIndianCurrency(l.outstandingWeeklyDues)}
                        </span>
                      </div>
                    </>
                  ) : l.loanType === 'daily_due' ? (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Daily Due</span>
                        <span className="font-bold text-amber-300">
                          {formatIndianCurrency(l.dailyDueAmount || 100)} / Day
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Dues Remaining</span>
                        <span className="font-bold text-amber-400">
                          {formatIndianCurrency(l.outstandingWeeklyDues)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">
                          {l.spFrequency === 'weekly' ? 'Weekly Interest' : 'Monthly Interest'}
                        </span>
                        <span className="font-bold text-purple-300">
                          {formatIndianCurrency(
                            l.spFrequency === 'weekly'
                              ? (l.outstandingPrincipal * (l.interestRateWeekly || 0.5)) / 100
                              : (l.outstandingPrincipal * l.interestRateMonthly) / 100
                          )}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Interest Out.</span>
                        <span className="font-bold text-purple-300">
                          {formatIndianCurrency(l.outstandingInterest)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Overdue Late Fee Indicator (Exempt for Daily Due) */}
                {l.outstandingPenalties > 0 && l.loanType !== 'daily_due' && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
                    <span className="text-[10px] uppercase font-semibold">Overdue Penalty (₹150):</span>
                    <span className="font-bold font-tabular">
                      {formatIndianCurrency(l.outstandingPenalties)}
                    </span>
                  </div>
                )}
                {l.loanType === 'daily_due' && (
                  <div className="mt-2.5 px-3 py-1 rounded-lg bg-amber-950/30 border border-amber-500/20 flex items-center gap-1.5 text-[10px] text-amber-300/80 font-mono">
                    <span>⚡ Daily Due Agreement · Strictly Zero Penalty</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                {l.loanType === 'sp_interest_only' ? (
                  <button
                    onClick={() => onOpenPayment(l.id)}
                    className="flex-1 py-1.5 px-2 text-center text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors whitespace-nowrap shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                  >
                    Collect SP Interest
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenMultipleDue(l.id)}
                    className="flex-1 py-1.5 px-2 text-center text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  >
                    {l.loanType === 'daily_due' ? 'Multiple Day Dues' : 'Multiple Due'}
                  </button>
                )}

                <button
                  onClick={() => onOpenPayment(l.id)}
                  className="py-1.5 px-3 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
                >
                  Payment
                </button>

                {activeToken && (
                  <button
                    onClick={() => onOpenPassbookInApp(activeToken.token)}
                    className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Open Customer Passbook"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* --- NEW LOAN MODAL (Matching Screenshot_20261023-052750_e97f4b65.jpg) --- */}
      {isNewLoanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl my-6 bg-[#0c1322] border border-cyan-500/30 rounded-2xl shadow-2xl p-5 sm:p-6 neon-glow-cyan text-slate-100 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Issue New Customer Loan
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Supports multiple separate loans per customer with distinct Loan IDs & custom schemes
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNewLoanOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLoanSubmit} className="mt-4 space-y-4 text-xs">
              
              {/* SELECT CUSTOMER * */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Customer *
                </label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    const cust = customers.find((c) => c.id === e.target.value);
                    if (cust && loanNotes.includes('Speed Interest')) {
                      setLoanNotes(`Speed Interest (SP) Loan - ₹${spWeeklyAmount.toLocaleString('en-IN')}/week speed interest for ${cust.fullName}`);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
                >
                  <option value="">-- Choose Customer --</option>
                  {customers.map((c) => {
                    const existingCount = loans.filter((l) => l.customerId === c.id && l.status !== 'completed').length;
                    return (
                      <option key={c.id} value={c.id}>
                        {c.fullName} ({c.uniqueId} - {c.phone}) — {existingCount} existing loan(s)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* SELECT LOAN SCHEME & FREQUENCY * */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Loan Scheme & Frequency *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  
                  {/* Card 1: Weekly Loan */}
                  <button
                    type="button"
                    onClick={() => {
                      setLoanType('standard_weekly');
                      setLoanNotes('Weekly Sunday Microloan (Sunday Dues)');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      loanType === 'standard_weekly'
                        ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-white">Weekly Loan</div>
                      <div className="text-[10px] text-cyan-400/90 mt-0.5 leading-snug">
                        Sunday dues · 10 weeks · 1% Wed penalty
                      </div>
                    </div>
                  </button>

                  {/* Card 2: Daily Due */}
                  <button
                    type="button"
                    onClick={() => {
                      setLoanType('daily_due');
                      setLoanNotes('Daily Due Loan (Daily collections, Zero Late Penalty)');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      loanType === 'daily_due'
                        ? 'border-amber-400 bg-amber-950/60 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-white">Daily Due</div>
                      <div className="text-[10px] text-amber-400 font-medium mt-0.5 leading-snug">
                        Daily collections · No Penalty (₹0)
                      </div>
                    </div>
                  </button>

                  {/* Card 3: Speed Interest (SP) with SPEED VATTI MODEL badge */}
                  <button
                    type="button"
                    onClick={() => {
                      setLoanType('sp_interest_only');
                      setLoanNotes(`Speed Interest (SP) Loan - ₹${spWeeklyAmount.toLocaleString('en-IN')}/week speed interest`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      loanType === 'sp_interest_only'
                        ? 'border-rose-500 bg-rose-950/40 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.3)] ring-1 ring-rose-500'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-white">Speed Interest (SP)</span>
                        <span className="px-1.5 py-0.5 text-[8.5px] font-black uppercase rounded bg-rose-600 text-white tracking-wider">
                          SPEED VATTI MODEL
                        </span>
                      </div>
                      <div className="text-[10px] text-rose-300 mt-1 leading-snug">
                        Fixed speed vatti (e.g. ₹1,000/wk for 10k)
                      </div>
                    </div>
                  </button>

                </div>
              </div>

              {/* Quick Principal Presets */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400">Quick Principal Presets:</span>
                <div className="flex flex-wrap items-center gap-2">
                  {[10000, 20000, 30000, 40000, 50000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setPrincipal(preset);
                        setUpfrontDeduction(Math.round(preset * 0.1));
                        setSpWeeklyAmount(Math.round(preset * 0.1));
                        setWeeklyDue(Math.round(preset / 10));
                        setDailyDue(Math.round(preset / 100));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                        principal === preset
                          ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                      }`}
                    >
                      ₹{preset.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3-Column Principal & Net Disbursed Cash Box */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                      Loan Principal Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-400 font-bold">₹</span>
                      <input
                        type="number"
                        required
                        min={1000}
                        step={500}
                        value={principal}
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          setPrincipal(p);
                        }}
                        className="w-full pl-6 pr-2.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                      Upfront Deduction (Tracked Separately) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-amber-400 font-bold">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={upfrontDeduction}
                        onChange={(e) => setUpfrontDeduction(Number(e.target.value))}
                        className="w-full pl-6 pr-2.5 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                      Net Disbursed Cash
                    </label>
                    <div className="py-2 px-3 bg-cyan-950/40 border border-cyan-500/40 rounded-lg flex items-center justify-between">
                      <span className="text-[10px] text-cyan-300 font-semibold uppercase">Cash In Hand</span>
                      <span className="text-base font-bold text-cyan-400 font-mono">
                        {formatIndianCurrency(netDisbursed)}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* SCHEME SETTINGS SUB-CARD */}
              {loanType === 'sp_interest_only' && (
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-rose-200">
                        Speed Interest (SP) Settings (₹{principal.toLocaleString('en-IN')} = ₹{spWeeklyAmount.toLocaleString('en-IN')}/week)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded bg-rose-600 text-white tracking-wider">
                      SPEED VATTI MODEL
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-rose-300/80">Quick Weekly Speed Interest:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[500, 1000, 1500, 2000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSpWeeklyAmount(preset)}
                          className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                            spWeeklyAmount === preset
                              ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                        >
                          ₹{preset}/wk
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                        Weekly Speed Interest (₹ / Week) *
                      </label>
                      <input
                        type="number"
                        min={100}
                        step={50}
                        required
                        value={spWeeklyAmount}
                        onChange={(e) => setSpWeeklyAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-rose-500/50 rounded-lg text-rose-200 font-mono font-bold focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                        Duration (Weeks)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={52}
                        value={tenureWeeks}
                        onChange={(e) => setTenureWeeks(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-rose-400"
                      />
                      <span className="text-[10px] text-rose-400 block mt-0.5">
                        Principal amortized: ₹{Math.round(principal / tenureWeeks).toLocaleString('en-IN')}/wk
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {loanType === 'standard_weekly' && (
                <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-200">
                      Weekly Sunday Loan Settings
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-cyan-900/60 text-cyan-300 border border-cyan-500/30">
                      WEEKLY MODEL
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-cyan-300/80">Quick Weekly Due:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[500, 1000, 1500, 2000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setWeeklyDue(preset)}
                          className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                            weeklyDue === preset
                              ? 'bg-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                        >
                          ₹{preset}/wk
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                        Weekly Due Amount (₹) *
                      </label>
                      <input
                        type="number"
                        min={100}
                        step={50}
                        required
                        value={weeklyDue}
                        onChange={(e) => setWeeklyDue(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/50 rounded-lg text-cyan-200 font-mono font-bold focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                        Tenure (Weeks) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={52}
                        value={tenureWeeks}
                        onChange={(e) => setTenureWeeks(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {loanType === 'daily_due' && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-200">
                      Daily Due Settings (Strictly Zero Late Penalty)
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30">
                      NO PENALTY (₹0)
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-amber-300/80">Quick Daily Due:</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[100, 200, 500, 1000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDailyDue(preset)}
                          className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                            dailyDue === preset
                              ? 'bg-amber-400 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                        >
                          ₹{preset}/day
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                        Daily Due Amount (₹) *
                      </label>
                      <input
                        type="number"
                        min={10}
                        step={10}
                        required
                        value={dailyDue}
                        onChange={(e) => setDailyDue(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-amber-500/50 rounded-lg text-amber-200 font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                        Tenure (Days) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={tenureDays}
                        onChange={(e) => setTenureDays(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DATE & NOTES ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                    Disbursement / Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                    Loan Notes / Reference
                  </label>
                  <input
                    type="text"
                    value={loanNotes}
                    onChange={(e) => setLoanNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Expandable Schedule Details Review */}
              {showSchedulePreview && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span>Generated Schedule Preview</span>
                    <span className="text-cyan-400 font-mono text-[11px]">
                      {loanType === 'daily_due'
                        ? `${tenureDays} Daily Installments @ ₹${dailyDue}`
                        : `${tenureWeeks} Weekly Installments @ ₹${weeklyDue}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 font-mono pt-1">
                    <div>Total Loan Value: ₹{(loanType === 'daily_due' ? dailyDue * tenureDays : weeklyDue * tenureWeeks).toLocaleString('en-IN')}</div>
                    <div>Upfront Deduction: ₹{upfrontDeduction.toLocaleString('en-IN')}</div>
                    <div>Net Handover: ₹{netDisbursed.toLocaleString('en-IN')}</div>
                    <div>Penalty Rule: {loanType === 'daily_due' ? 'No Penalty (₹0)' : '₹150 on Wed'}</div>
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSchedulePreview(!showSchedulePreview)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium self-start sm:self-auto"
                >
                  {showSchedulePreview ? 'Hide Schedule Details' : 'Review Schedule Details'}
                </button>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setIsNewLoanOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors font-medium text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 font-bold text-xs text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
                  >
                    Create Loan & Issue Loan ID
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
