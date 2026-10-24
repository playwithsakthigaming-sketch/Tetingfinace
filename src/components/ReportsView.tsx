/**
 * Sri Sennamal Finance — Financial Reports & Analytics
 * Daily, Weekly, Monthly Collections, Overdue breakdowns, and CSV export.
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Customer, Installment, Loan, Payment, Refund } from '../types/finance';
import { formatIndianCurrency } from '../utils/financeCalculations';

interface ReportsViewProps {
  payments: Payment[];
  refunds: Refund[];
  loans: Loan[];
  customers: Customer[];
  installments: Installment[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  payments,
  refunds,
  loans,
  customers,
  installments,
}) => {
  const [reportType, setReportType] = useState<'collections' | 'overdue' | 'completed' | 'sp'>('collections');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  // Aggregations
  const totalCollectedGross = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);
  const netCollected = totalCollectedGross - totalRefunded;

  const totalPrincipalOut = loans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
  const totalDuesOut = loans.reduce((sum, l) => sum + l.outstandingWeeklyDues, 0);
  const totalPenaltiesOut = loans.reduce((sum, l) => sum + l.outstandingPenalties, 0);
  const totalInterestOut = loans.reduce((sum, l) => sum + l.outstandingInterest, 0);

  const overdueList = installments.filter((i) => i.isOverdue && !i.isPaid);
  const completedLoans = loans.filter((l) => l.status === 'completed');

  const handleExportCSV = () => {
    let rows: string[] = [];
    let headers: string[] = [];
    const filename = `Sri_Sennamal_Finance_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'collections') {
      headers = ['Receipt No', 'Date', 'Loan ID', 'Borrower', 'Method', 'Weekly Due Alloc', 'Interest Alloc', 'Penalty Alloc', 'Principal Alloc', 'Amount'];
      rows = payments.map((p) => {
        const cust = customers.find((c) => c.id === p.customerId);
        const l = loans.find((item) => item.id === p.loanId);
        return [
          p.receiptNo,
          new Date(p.paymentDate).toLocaleDateString('en-IN'),
          l?.loanId || p.loanId,
          `"${cust?.fullName || 'Customer'}"`,
          p.paymentMethod,
          p.allocations.weeklyDue,
          p.allocations.interest,
          p.allocations.penalty,
          p.allocations.principalRepayment,
          p.amount,
        ].join(',');
      });
    } else if (reportType === 'overdue') {
      headers = ['Loan ID', 'Borrower', 'Phone', 'Week', 'Due Date (Sunday)', 'Amount Due', 'Penalty Assessed'];
      rows = overdueList.map((inst) => {
        const l = loans.find((item) => item.id === inst.loanId);
        const cust = l ? customers.find((c) => c.id === l.customerId) : null;
        return [
          l?.loanId || inst.loanId,
          `"${cust?.fullName || 'Customer'}"`,
          cust?.phone || '',
          inst.weekNumber,
          inst.dueDate,
          inst.amountDue,
          inst.penaltyAssessed,
        ].join(',');
      });
    } else {
      headers = ['Loan ID', 'Borrower', 'Type', 'Disbursed', 'Principal Repaid', 'Dues Settled', 'Status'];
      rows = completedLoans.map((l) => {
        const cust = customers.find((c) => c.id === l.customerId);
        return [
          l.loanId,
          `"${cust?.fullName || 'Customer'}"`,
          l.loanType,
          l.actualDisbursement,
          l.totalPaidPrincipal,
          l.totalPaidDues,
          l.status,
        ].join(',');
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
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
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white font-display">
              Collections & Portfolio Reports
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Reconciled collections data, overdue aging, interest realization, and exportable financial reports.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-cyan-400" />
          Export Report (CSV)
        </button>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0c1322] border border-cyan-500/20">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Net Collections</span>
          <span className="text-xl font-bold text-cyan-300 font-tabular">
            {formatIndianCurrency(netCollected)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Gross: {formatIndianCurrency(totalCollectedGross)} - Ref: {formatIndianCurrency(totalRefunded)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1322] border border-blue-500/20">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Principal Outstanding</span>
          <span className="text-xl font-bold text-blue-400 font-tabular">
            {formatIndianCurrency(totalPrincipalOut)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Active Principal</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1322] border border-amber-500/20">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Weekly Dues Outstanding</span>
          <span className="text-xl font-bold text-amber-400 font-tabular">
            {formatIndianCurrency(totalDuesOut)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Pending Installments</span>
        </div>

        <div className="p-4 rounded-xl bg-[#0c1322] border border-rose-500/20">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Late Penalties Out.</span>
          <span className="text-xl font-bold text-rose-400 font-tabular">
            {formatIndianCurrency(totalPenaltiesOut)}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">{overdueList.length} Overdue Dues</span>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        <button
          onClick={() => setReportType('collections')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            reportType === 'collections'
              ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          All Collections ({payments.length})
        </button>

        <button
          onClick={() => setReportType('overdue')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            reportType === 'overdue'
              ? 'bg-rose-950/60 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Overdue Installments ({overdueList.length})
        </button>

        <button
          onClick={() => setReportType('completed')}
          className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
            reportType === 'completed'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-semibold'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
        >
          Completed Loans ({completedLoans.length})
        </button>
      </div>

      {/* Main Report Table Container */}
      <div className="rounded-2xl neon-card p-5 overflow-hidden">
        
        {reportType === 'collections' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Weekly Due</th>
                  <th className="py-2.5 px-3 text-right">Interest</th>
                  <th className="py-2.5 px-3 text-right">Penalty</th>
                  <th className="py-2.5 px-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-tabular">
                {payments.map((p) => {
                  const cust = customers.find((c) => c.id === p.customerId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-cyan-400">
                        {p.receiptNo}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {cust?.fullName || 'Customer'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-slate-200">
                        {formatIndianCurrency(p.allocations.weeklyDue)}
                      </td>
                      <td className="py-3 px-3 text-right text-purple-300">
                        {formatIndianCurrency(p.allocations.interest)}
                      </td>
                      <td className="py-3 px-3 text-right text-rose-300">
                        {formatIndianCurrency(p.allocations.penalty)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {formatIndianCurrency(p.amount, true)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'overdue' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Loan ID</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Week</th>
                  <th className="py-2.5 px-3">Due Date (Sunday)</th>
                  <th className="py-2.5 px-3 text-right">Due Amount</th>
                  <th className="py-2.5 px-3 text-right">Late Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-tabular">
                {overdueList.map((inst) => {
                  const l = loans.find((item) => item.id === inst.loanId);
                  const cust = l ? customers.find((c) => c.id === l.customerId) : null;
                  return (
                    <tr key={inst.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {l?.loanId || inst.loanId}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {cust?.fullName || 'Customer'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {cust?.phone}
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        Week {inst.weekNumber}
                      </td>
                      <td className="py-3 px-3 text-rose-400">
                        {inst.dueDate} (Sunday)
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-white">
                        {formatIndianCurrency(inst.amountDue)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-400">
                        {formatIndianCurrency(inst.penaltyAssessed || 150)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {reportType === 'completed' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Loan ID</th>
                  <th className="py-2.5 px-3">Borrower</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 text-right">Disbursed</th>
                  <th className="py-2.5 px-3 text-right">Total Dues Settled</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-tabular">
                {completedLoans.map((l) => {
                  const cust = customers.find((c) => c.id === l.customerId);
                  return (
                    <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">
                        {l.loanId}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {cust?.fullName || 'Customer'}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {l.loanType === 'sp_interest_only' ? 'SP Loan' : 'Weekly Loan'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-200">
                        {formatIndianCurrency(l.actualDisbursement)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {formatIndianCurrency(l.totalPaidDues || l.totalPaidPrincipal)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          Completed & Closed
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
