/**
 * Sri Sennamal Finance — Customer Loan Ledger
 * Chronological, immutable audit ledger for every loan.
 * Shows debit/credit transactions, exact balances after each event, and reference numbers.
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from 'lucide-react';
import { Customer, LedgerTransaction, Loan } from '../types/finance';
import { formatIndianCurrency } from '../utils/financeCalculations';

interface CustomerLedgerViewProps {
  ledger: LedgerTransaction[];
  loans: Loan[];
  customers: Customer[];
}

export const CustomerLedgerView: React.FC<CustomerLedgerViewProps> = ({
  ledger,
  loans,
  customers,
}) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTransactions = ledger.filter((item) => {
    if (selectedLoanId !== 'all' && item.loanId !== selectedLoanId) return false;
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const cust = customers.find((c) => c.id === item.customerId);
      const loan = loans.find((l) => l.id === item.loanId);
      const matches =
        item.description.toLowerCase().includes(q) ||
        item.referenceNo.toLowerCase().includes(q) ||
        (cust && cust.fullName.toLowerCase().includes(q)) ||
        (loan && loan.loanId.toLowerCase().includes(q));
      if (!matches) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Loan ID', 'Customer', 'Category', 'Type', 'Amount', 'Ref No', 'Balance After'];
    const rows = filteredTransactions.map((tx) => {
      const cust = customers.find((c) => c.id === tx.customerId);
      const loan = loans.find((l) => l.id === tx.loanId);
      return [
        tx.id,
        new Date(tx.date).toLocaleString('en-IN'),
        loan?.loanId || tx.loanId,
        `"${cust?.fullName || 'Customer'}"`,
        tx.category,
        tx.type,
        tx.amount,
        `"${tx.referenceNo}"`,
        tx.balanceAfter,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sri_Sennamal_Finance_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl neon-card">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-display">
              Chronological Customer Loan Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete debit/credit transaction record for all loan disbursements, collections, refunds, and penalties.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          Export Ledger (CSV)
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-xl neon-card flex flex-wrap items-center gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search description, reference, borrower..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Loan Filter */}
        <select
          value={selectedLoanId}
          onChange={(e) => setSelectedLoanId(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
        >
          <option value="all">All Loans</option>
          {loans.map((l) => {
            const cust = customers.find((c) => c.id === l.customerId);
            return (
              <option key={l.id} value={l.id}>
                {l.loanId} — {cust?.fullName}
              </option>
            );
          })}
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
        >
          <option value="all">All Categories</option>
          <option value="disbursement">Loan Disbursements</option>
          <option value="payment">Weekly Payments</option>
          <option value="penalty">Wednesday Penalties</option>
          <option value="interest">SP Loan Interest</option>
          <option value="principal_repayment">Principal Repayments</option>
          <option value="refund">Refunds Issued</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl neon-card p-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Loan ID</th>
                <th className="py-2.5 px-3">Borrower</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Debit / Credit</th>
                <th className="py-2.5 px-3">Reference No</th>
                <th className="py-2.5 px-3 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-tabular">
              {filteredTransactions.map((tx) => {
                const cust = customers.find((c) => c.id === tx.customerId);
                const targetLoan = loans.find((l) => l.id === tx.loanId);
                const isCredit = tx.type === 'credit'; // payment made (reduces due)

                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-cyan-400">
                      {targetLoan?.loanId || tx.loanId}
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {cust?.fullName || 'Customer'}
                    </td>
                    <td className="py-3 px-3 text-slate-200">
                      {tx.description}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          isCredit
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold">
                      <span className={isCredit ? 'text-emerald-400' : 'text-rose-400'}>
                        {isCredit ? '-' : '+'}{formatIndianCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                      {tx.referenceNo || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-white">
                      {formatIndianCurrency(tx.balanceAfter)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
