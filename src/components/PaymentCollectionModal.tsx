/**
 * Sri Sennamal Finance — Payment Collection & Financial Transactions Panel
 * Faithful recreation of reference Screenshot_20261023-052817_11dd7474.jpg:
 * - 3 Switcher Tabs: Standard Payment, Day Due / Multi-Day, Record Refund
 * - Section 1: Customer Search & Selector + 4 Balance Metric Pills
 * - Section 2: Target Loan Entry Cards (Weekly, Daily Due [No Penalty], Speed SP)
 * - Section 3: Installment Cycle, Scheme Tag, Quick Amount Chips, Big ₹ Input,
 *   Payment Method, Transaction Ref (Auto-Gen), Payment Date & Time
 * - 4-Bucket Payment Allocation with Auto-Reconcile Check
 * - 3 Confirmation Action Buttons: Confirm & Send WhatsApp, Confirm & Print Receipt, Confirm Payment
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  X,
  CreditCard,
  Coins,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  Send,
  Printer,
  Check,
  Search,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Customer, Installment, Loan, Payment } from '../types/finance';
import {
  calculateMultipleDueAllocation,
  formatCoveredWeeksSummary,
  formatIndianCurrency,
} from '../utils/financeCalculations';
import { sendWhatsAppInvoice } from '../utils/whatsappInvoice';

interface PaymentCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: Loan[];
  customers: Customer[];
  installments: Installment[];
  preSelectedLoanId?: string;
  onCollectWeeklyDues: (params: {
    loanId: string;
    amountReceived: number;
    paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
    referenceNo?: string;
    notes?: string;
    excessAllocation?: 'next_due' | 'principal' | 'advance';
  }) => { payment: Payment; coveredWeeksText: string };
  onCollectSPPayment: (params: {
    loanId: string;
    interestAmount: number;
    principalRepayment: number;
    paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
    referenceNo?: string;
    notes?: string;
  }) => Payment;
  onViewReceipt: (payment: Payment) => void;
  // If embedded in a page rather than a popup modal
  isEmbedded?: boolean;
  onSwitchTab?: (tab: string) => void;
}

export const PaymentCollectionModal: React.FC<PaymentCollectionModalProps> = ({
  isOpen,
  onClose,
  loans,
  customers,
  installments,
  preSelectedLoanId,
  onCollectWeeklyDues,
  onCollectSPPayment,
  onViewReceipt,
  isEmbedded = false,
  onSwitchTab,
}) => {
  // Top Switcher Tabs: 'standard' | 'multiday' | 'refund'
  const [activeTabMode, setActiveTabMode] = useState<'standard' | 'multiday' | 'refund'>('standard');

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  // Selected Loan ID
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');

  // Installment Cycle selection
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>('auto');

  // Amount & Allocation Buckets
  const [amountReceived, setAmountReceived] = useState<number>(2000);
  const [allocDue, setAllocDue] = useState<number>(2000);
  const [allocInterest, setAllocInterest] = useState<number>(0);
  const [allocPenalty, setAllocPenalty] = useState<number>(0);
  const [allocPrincipal, setAllocPrincipal] = useState<number>(0);

  // Transaction details
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Other'>('Cash');
  const [referenceNo, setReferenceNo] = useState<string>('CASH-' + Math.floor(100000 + Math.random() * 900000));
  const [paymentDateTime, setPaymentDateTime] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
  });
  const [collectionNote, setCollectionNote] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initialize or synchronize customer and loan selection
  useEffect(() => {
    if (preSelectedLoanId) {
      const targetLoan = loans.find((l) => l.id === preSelectedLoanId);
      if (targetLoan) {
        setSelectedCustomerId(targetLoan.customerId);
        setSelectedLoanId(targetLoan.id);
        return;
      }
    }

    if (!selectedCustomerId && customers.length > 0) {
      // Pick first customer with active loans, or first customer
      const custWithLoans = customers.find((c) => loans.some((l) => l.customerId === c.id && l.status !== 'completed'));
      const initialCust = custWithLoans || customers[0];
      setSelectedCustomerId(initialCust.id);
    }
  }, [preSelectedLoanId, customers, loans]);

  // When selected customer changes, pick their first active loan
  const customerLoans = useMemo(() => {
    return loans.filter((l) => l.customerId === selectedCustomerId && l.status !== 'completed');
  }, [loans, selectedCustomerId]);

  useEffect(() => {
    if (customerLoans.length > 0) {
      if (!customerLoans.some((l) => l.id === selectedLoanId)) {
        setSelectedLoanId(customerLoans[0].id);
      }
    } else {
      const anyLoan = loans.find((l) => l.customerId === selectedCustomerId);
      setSelectedLoanId(anyLoan?.id || '');
    }
  }, [selectedCustomerId, customerLoans]);

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
  const currentLoan = loans.find((l) => l.id === selectedLoanId);

  // Filtered customer list for the search box
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.uniqueId.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Customer aggregate balances across all loans
  const customerMetrics = useMemo(() => {
    if (!selectedCustomerId) return { principalBal: 0, duesBal: 0, interestBal: 0, penaltyBal: 0 };
    const allCustLoans = loans.filter((l) => l.customerId === selectedCustomerId && l.status !== 'completed');
    
    let principalBal = 0;
    let duesBal = 0;
    let interestBal = 0;
    let penaltyBal = 0;

    allCustLoans.forEach((l) => {
      principalBal += l.outstandingPrincipal || 0;
      if (l.loanType === 'sp_interest_only') {
        interestBal += l.outstandingInterest || 0;
      } else {
        duesBal += l.outstandingWeeklyDues || 0;
      }
      penaltyBal += l.outstandingPenalties || 0;
    });

    return {
      principalBal,
      duesBal,
      interestBal,
      penaltyBal: Math.max(0, penaltyBal),
    };
  }, [loans, selectedCustomerId]);

  // Loan installments
  const loanInstallments = useMemo(() => {
    if (!currentLoan) return [];
    return installments
      .filter((i) => i.loanId === currentLoan.id)
      .sort((a, b) => a.weekNumber - b.weekNumber);
  }, [installments, currentLoan]);

  const unpaidInstallments = useMemo(() => {
    return loanInstallments.filter((i) => !i.isPaid);
  }, [loanInstallments]);

  // Auto-set preset amount when loan changes
  useEffect(() => {
    if (currentLoan) {
      let defaultAmt = 1000;
      if (currentLoan.loanType === 'daily_due') {
        defaultAmt = currentLoan.dailyDueAmount || 200;
      } else if (currentLoan.loanType === 'standard_weekly') {
        defaultAmt = currentLoan.weeklyDueAmount || 2000;
      } else if (currentLoan.loanType === 'sp_interest_only') {
        if (currentLoan.spFrequency === 'weekly') {
          defaultAmt = Math.round((currentLoan.outstandingPrincipal * (currentLoan.interestRateWeekly || 10)) / 100) || 1000;
        } else {
          defaultAmt = Math.round((currentLoan.outstandingPrincipal * (currentLoan.interestRateMonthly || 2)) / 100) || 1000;
        }
      }
      setAmountReceived(defaultAmt);
      recalculateBuckets(defaultAmt, currentLoan);
    }
  }, [selectedLoanId]);

  // Recalculate 4-bucket allocation
  const recalculateBuckets = (amt: number, loanObj?: Loan | null) => {
    const loan = loanObj || currentLoan;
    if (!loan) {
      setAllocDue(amt);
      setAllocInterest(0);
      setAllocPenalty(0);
      setAllocPrincipal(0);
      return;
    }

    if (loan.loanType === 'sp_interest_only') {
      // SP Loan: default to paying interest first, remainder to principal
      const weeklyInterest =
        loan.spFrequency === 'weekly'
          ? Math.round((loan.outstandingPrincipal * (loan.interestRateWeekly || 10)) / 100)
          : Math.round((loan.outstandingPrincipal * (loan.interestRateMonthly || 2)) / 100);

      const interestPart = Math.min(amt, weeklyInterest || 1000);
      const principalPart = Math.max(0, amt - interestPart);

      setAllocDue(0);
      setAllocInterest(interestPart);
      setAllocPenalty(0);
      setAllocPrincipal(principalPart);
    } else {
      // Standard Weekly or Daily Due
      // Day Due has NO penalty (₹0 penalty)
      const penaltyPending = loan.loanType === 'daily_due' ? 0 : Math.max(0, loan.outstandingPenalties || 0);
      let rem = amt;

      let penaltyPart = 0;
      if (penaltyPending > 0) {
        penaltyPart = Math.min(rem, penaltyPending);
        rem -= penaltyPart;
      }

      setAllocPenalty(penaltyPart);
      setAllocDue(rem);
      setAllocInterest(0);
      setAllocPrincipal(0);
    }
  };

  const handleAmountChange = (newAmt: number) => {
    setAmountReceived(newAmt);
    recalculateBuckets(newAmt);
  };

  const handleQuickAmount = (val: number) => {
    setAmountReceived(val);
    recalculateBuckets(val);
  };

  const handleRegenerateRef = () => {
    const prefix = paymentMethod === 'Cash' ? 'CASH' : paymentMethod === 'UPI' ? 'UPI' : 'TXN';
    const num = Math.floor(100000 + Math.random() * 900000);
    setReferenceNo(`${prefix}-${num}`);
  };

  const totalAllocated = allocDue + allocInterest + allocPenalty + allocPrincipal;
  const isReconciled = totalAllocated === amountReceived && amountReceived > 0;

  // Process Payment Execution
  const processPayment = (actionType: 'confirm' | 'print' | 'whatsapp') => {
    setStatusMessage(null);
    if (!currentLoan) {
      setStatusMessage({ type: 'error', text: 'Please select a valid customer loan entry.' });
      return;
    }
    if (amountReceived <= 0) {
      setStatusMessage({ type: 'error', text: 'Payment amount must be greater than zero.' });
      return;
    }
    if (totalAllocated !== amountReceived) {
      setStatusMessage({
        type: 'error',
        text: `Allocated sum (₹${totalAllocated}) does not match received amount (₹${amountReceived}).`,
      });
      return;
    }

    try {
      let createdPayment: Payment;
      let coveredText = '';

      if (currentLoan.loanType === 'sp_interest_only') {
        createdPayment = onCollectSPPayment({
          loanId: currentLoan.id,
          interestAmount: Number(allocInterest),
          principalRepayment: Number(allocPrincipal),
          paymentMethod,
          referenceNo: referenceNo || `SP-${Date.now()}`,
          notes:
            collectionNote ||
            `Speed Interest (SP) ${currentLoan.spFrequency === 'weekly' ? 'Weekly' : 'Monthly'} Collection`,
        });
        coveredText = `SP Interest: ₹${allocInterest}${allocPrincipal > 0 ? `, Principal: ₹${allocPrincipal}` : ''}`;
      } else {
        const res = onCollectWeeklyDues({
          loanId: currentLoan.id,
          amountReceived: Number(amountReceived),
          paymentMethod,
          referenceNo: referenceNo || `REC-${Date.now()}`,
          notes:
            collectionNote ||
            (currentLoan.loanType === 'daily_due'
              ? 'Daily Due Collection (No Penalty)'
              : 'Weekly Due Sunday Collection'),
          excessAllocation: 'next_due',
        });
        createdPayment = res.payment;
        coveredText = res.coveredWeeksText;
      }

      setStatusMessage({
        type: 'success',
        text: `Payment of ${formatIndianCurrency(amountReceived)} recorded successfully! Receipt: ${createdPayment.receiptNo}`,
      });

      // Handle Action Types
      if (actionType === 'whatsapp') {
        sendWhatsAppInvoice({
          payment: createdPayment,
          customer: currentCustomer,
          loan: currentLoan,
          coveredWeeksText: coveredText,
          remainingBalance:
            currentLoan.loanType === 'sp_interest_only'
              ? currentLoan.outstandingPrincipal + currentLoan.outstandingInterest - amountReceived
              : Math.max(0, currentLoan.outstandingWeeklyDues - amountReceived),
        });
        if (!isEmbedded) onClose();
        onViewReceipt(createdPayment);
      } else if (actionType === 'print') {
        if (!isEmbedded) onClose();
        onViewReceipt(createdPayment);
      } else {
        // Just confirm
        setTimeout(() => {
          if (!isEmbedded) onClose();
        }, 1500);
      }

      // Re-generate reference number for next collection
      handleRegenerateRef();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Payment execution failed.' });
    }
  };

  if (!isOpen && !isEmbedded) return null;

  const content = (
    <div className="space-y-5 text-slate-100">
      
      {/* Top Bar matching reference Screenshot_20261023-052817_11dd7474.jpg */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-lg shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            ₹
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white font-display tracking-tight flex items-center gap-2">
              Payment Collection & Financial Transactions
            </h2>
            <p className="text-[11px] text-slate-400 line-clamp-1">
              Supports Standard/Installment, Multiple-Day Collection (Day Due), and Reversible Refunds with full audit trail
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Agent: Sri Sennamal Admin (administrator)</span>
          </div>
          {!isEmbedded && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Top 3 Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveTabMode('standard')}
          className={`py-2 px-3 rounded-lg font-semibold text-center transition-all ${
            activeTabMode === 'standard'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Standard Payment (Installments & SP Interest)
        </button>

        <button
          type="button"
          onClick={() => {
            if (onSwitchTab) {
              onSwitchTab('multiple_due');
            } else {
              setActiveTabMode('multiday');
            }
          }}
          className={`py-2 px-3 rounded-lg font-semibold text-center transition-all ${
            activeTabMode === 'multiday'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Day Due / Multi-Day (Multiple days in 1 txn (Req 2))
        </button>

        <button
          type="button"
          onClick={() => {
            if (onSwitchTab) {
              onSwitchTab('refunds');
            } else {
              setActiveTabMode('refund');
            }
          }}
          className={`py-2 px-3 rounded-lg font-semibold text-center transition-all ${
            activeTabMode === 'refund'
              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Record Refund (Overpayment reversal (Req 1))
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/50 border-rose-500/40 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* SECTION 1: 1. SELECT CUSTOMER * */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          1. Select Customer *
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search borrower by name, ID or mobile..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Customer Dropdown */}
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-medium"
          >
            {customers.length === 0 && (
              <option value="">-- No customers found in database --</option>
            )}
            {filteredCustomers.map((c) => {
              const custLoansCount = loans.filter((l) => l.customerId === c.id && l.status !== 'completed').length;
              return (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.uniqueId}) — {custLoansCount} Loan{custLoansCount !== 1 ? 's' : ''} · {c.address || 'Tamil Nadu'}
                </option>
              );
            })}
          </select>
        </div>

        {customers.length === 0 && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs text-center space-y-1.5">
            <div className="font-semibold text-slate-300">All customer & loan data has been cleared (0 records).</div>
            <div className="text-[11px] text-cyan-400">
              Go to "Active Loan Book" to issue a new loan, or use Settings to "Reset with Demo Data".
            </div>
          </div>
        )}

        {/* Customer Balance Metric Pills Card */}
        {currentCustomer && (
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-bold text-white text-sm">{currentCustomer.fullName}</span>
                <span className="text-slate-400 text-xs ml-2 font-mono">{currentCustomer.phone}</span>
                <span className="text-slate-500 text-xs ml-2">({currentCustomer.address || 'Tamil Nadu'})</span>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono font-medium">
                Customer ID: {currentCustomer.uniqueId}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 font-tabular text-xs">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Total Principal Bal</span>
                <span className="font-bold text-cyan-400 text-sm">
                  {formatIndianCurrency(customerMetrics.principalBal)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Weekly/Daily Dues</span>
                <span className="font-bold text-amber-400 text-sm">
                  {formatIndianCurrency(customerMetrics.duesBal)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Interest Bal</span>
                <span className="font-bold text-purple-400 text-sm">
                  {formatIndianCurrency(customerMetrics.interestBal)}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Penalty Bal</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {formatIndianCurrency(customerMetrics.penaltyBal)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: 2. TARGET LOAN ENTRY * */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
            2. Target Loan Entry ({customerLoans.length} Loans on Record) *
          </label>
          <span className="text-[11px] text-slate-400">Distinct Loan ID per entry</span>
        </div>

        {customerLoans.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs text-center">
            No active loans found for this customer.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {customerLoans.map((l) => {
              const isSelected = l.id === selectedLoanId;
              const isWeekly = l.loanType === 'standard_weekly';
              const isDaily = l.loanType === 'daily_due';
              const isSP = l.loanType === 'sp_interest_only';

              let badgeText = 'WEEKLY';
              let badgeColor = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
              let rateDueText = `₹${l.weeklyDueAmount || 1000}/wk`;

              if (isDaily) {
                badgeText = 'DAILY (NO PEN)';
                badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
                rateDueText = `₹${l.dailyDueAmount || 100}/day`;
              } else if (isSP) {
                badgeText = 'SPEED SP';
                badgeColor = 'bg-purple-950/80 text-purple-300 border-purple-500/40';
                const rate = l.spFrequency === 'weekly' ? l.interestRateWeekly || 10 : l.interestRateMonthly || 2;
                rateDueText = `₹${Math.round((l.outstandingPrincipal * rate) / 100)}/${l.spFrequency === 'weekly' ? 'wk SP' : 'mo SP'}`;
              }

              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLoanId(l.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900/90 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/50'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1.5 w-full">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-cyan-300 block">{l.loanId}</span>
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold border uppercase tracking-wider ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
                      <div className="flex justify-between font-tabular">
                        <span>Principal:</span>
                        <span className="font-semibold text-white">{formatIndianCurrency(l.originalPrincipal)}</span>
                      </div>
                      <div className="flex justify-between font-tabular">
                        <span>Rate/Due:</span>
                        <span className="font-semibold text-cyan-400">{rateDueText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                    {isSelected ? (
                      <span className="text-cyan-400 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Selected Loan
                      </span>
                    ) : (
                      <span className="text-slate-500">Click to Select</span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 font-medium">
                      Active
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: 3. INSTALLMENT CYCLE FOR SELECTED LOAN */}
      {currentLoan && (
        <div className="space-y-3.5 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              3. Installment Cycle for {currentLoan.loanId}
            </label>
            <span className="text-[11px] text-cyan-400 font-mono">
              Scheme: {currentLoan.loanType === 'daily_due'
                ? 'Daily Due (Daily · Strictly Zero Late Penalty)'
                : currentLoan.loanType === 'sp_interest_only'
                ? `Speed Interest (SP) - Speed Vatti Model (${currentLoan.spFrequency === 'weekly' ? 'Weekly' : 'Monthly'})`
                : 'Weekly Sunday Microloan (Sunday Dues)'}
            </span>
          </div>

          {/* Installment Cycle Dropdown */}
          <select
            value={selectedInstallmentId}
            onChange={(e) => setSelectedInstallmentId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
          >
            <option value="auto">
              Auto Allocation (Cover earliest unpaid dues / penalty first)
            </option>
            {unpaidInstallments.map((inst) => {
              const dueFormatted = new Date(inst.dueDate).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              return (
                <option key={inst.id} value={inst.id}>
                  {currentLoan.loanType === 'daily_due' ? `Day #${inst.weekNumber}` : `Week #${inst.weekNumber}`} (Due: {dueFormatted}) — Bal: ₹{inst.amountDue - inst.amountPaid} [PENDING]
                </option>
              );
            })}
          </select>

          {/* Quick Amount Preset Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Quick Amount Presets:</span>
              <span className="text-[11px] text-slate-400">Click to set Received Amount</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[200, 500, 1000, 2000, 5000, 10000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleQuickAmount(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    amountReceived === preset
                      ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  ₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Big Amount Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Amount Received (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-cyan-400">
                ₹
              </span>
              <input
                type="number"
                min={1}
                step={50}
                required
                value={amountReceived}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border-2 border-cyan-500/50 rounded-xl text-white font-mono font-bold text-xl focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              />
            </div>
          </div>

          {/* 3-Column Inputs: Method, Ref, Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  const m = e.target.value as any;
                  setPaymentMethod(m);
                  if (m === 'Cash' && !referenceNo.startsWith('CASH')) {
                    setReferenceNo('CASH-' + Math.floor(100000 + Math.random() * 900000));
                  } else if (m === 'UPI' && !referenceNo.startsWith('UPI')) {
                    setReferenceNo('UPI-' + Math.floor(100000 + Math.random() * 900000));
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="Cash">CASH COLLECTION</option>
                <option value="UPI">UPI (PhonePe / GPay / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Other">Cheque / Direct Office</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400 font-semibold">Transaction Ref *</label>
                <button
                  type="button"
                  onClick={handleRegenerateRef}
                  className="text-[10px] text-cyan-400 hover:underline"
                >
                  Auto-Gen
                </button>
              </div>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-semibold">
                Payment Date & Time *
              </label>
              <input
                type="datetime-local"
                value={paymentDateTime}
                onChange={(e) => setPaymentDateTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Collection Note Optional */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Receipt Note / Due Description (Optional)
            </label>
            <input
              type="text"
              placeholder={
                currentLoan.loanType === 'daily_due'
                  ? 'e.g. Day 10–15 Daily Collections'
                  : currentLoan.loanType === 'sp_interest_only'
                  ? 'e.g. Week 4 Speed Interest Payment'
                  : 'e.g. Sunday Regular Installment'
              }
              value={collectionNote}
              onChange={(e) => setCollectionNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 placeholder-slate-600"
            />
          </div>

        </div>
      )}

      {/* SECTION: PAYMENT ALLOCATION ACROSS 4 BUCKETS */}
      <div className="space-y-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Payment Allocation Across 4 Buckets
          </label>
          <button
            type="button"
            onClick={() => recalculateBuckets(amountReceived)}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium"
          >
            Re-calculate Auto Allocation
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">1. Due Amount (₹)</label>
            <input
              type="number"
              min={0}
              value={allocDue}
              onChange={(e) => setAllocDue(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">2. Interest / SP (₹)</label>
            <input
              type="number"
              min={0}
              value={allocInterest}
              onChange={(e) => setAllocInterest(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-purple-300 font-mono font-bold focus:outline-none focus:border-purple-400"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              3. Overdue Penalty (₹) {currentLoan?.loanType === 'daily_due' && <span className="text-[10px] text-amber-400">(₹0)</span>}
            </label>
            <input
              type="number"
              min={0}
              disabled={currentLoan?.loanType === 'daily_due'}
              value={allocPenalty}
              onChange={(e) => setAllocPenalty(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-400 disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">4. Principal Repay (₹)</label>
            <input
              type="number"
              min={0}
              value={allocPrincipal}
              onChange={(e) => setAllocPrincipal(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
            />
          </div>
        </div>

        {/* Reconciled Check Banner */}
        <div
          className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-mono font-bold border transition-colors ${
            isReconciled
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {isReconciled ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span>
              Allocated Sum: ₹{totalAllocated} / Received: ₹{amountReceived}
            </span>
          </div>

          <div>
            {isReconciled ? (
              <span className="px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[11px]">
                Reconciled 100% ✓
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-500/30 text-[11px]">
                Difference: ₹{amountReceived - totalAllocated}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ACTION FOOTER BUTTONS: 3 Main Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
        
        {/* Button 1 (Green): Confirm & Send WhatsApp */}
        <button
          type="button"
          onClick={() => processPayment('whatsapp')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Confirm & Send WhatsApp</span>
        </button>

        {/* Button 2 (Cyan): Confirm & Print Receipt */}
        <button
          type="button"
          onClick={() => processPayment('print')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-black bg-cyan-400 hover:bg-cyan-300 active:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Confirm & Print Receipt</span>
        </button>

        {/* Button 3 (Dark Cyan / Teal): Confirm Payment */}
        <button
          type="button"
          onClick={() => processPayment('confirm')}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-cyan-200 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Confirm Payment</span>
        </button>

      </div>

    </div>
  );

  // If embedded directly on page (e.g. Collections Desk)
  if (isEmbedded) {
    return <div className="p-5 sm:p-6 rounded-2xl neon-card">{content}</div>;
  }

  // Otherwise, render inside fixed modal backdrop
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-[#0c1322] border border-cyan-500/30 rounded-2xl shadow-2xl p-5 sm:p-6 neon-glow-cyan text-slate-100 max-h-[92vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
};
