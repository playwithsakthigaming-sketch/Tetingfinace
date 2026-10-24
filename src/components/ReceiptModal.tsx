/**
 * Sri Sennamal Finance — Simplified Invoice and Receipt Modal
 * Conforms strictly to the 8 required fields:
 * 1. Receipt No
 * 2. Loan ID
 * 3. Date
 * 4. Customer Name
 * 5. Current Due (e.g. Week 1, Week 2, or Week 1–10)
 * 6. Amount Received
 * 7. Reference Number
 * 8. Payment Method
 * Plus WhatsApp Invoice Send System integration!
 */

import React, { useState } from 'react';
import {
  Printer,
  X,
  CheckCircle,
  ShieldCheck,
  Send,
  Copy,
  Check,
  MessageCircle,
  BookOpen,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { Customer, Loan, Payment } from '../types/finance';
import { formatIndianCurrency } from '../utils/financeCalculations';
import { sendWhatsAppInvoice, formatWhatsAppInvoiceText } from '../utils/whatsappInvoice';
import { financeStore } from '../services/financeStore';

interface ReceiptModalProps {
  payment: Payment | null;
  customerName: string;
  loanIdText: string;
  currentDueText: string;
  onClose: () => void;
  customer?: Customer | null;
  loan?: Loan | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  customerName,
  loanIdText,
  currentDueText,
  onClose,
  customer,
  loan,
}) => {
  const [copied, setCopied] = useState(false);
  const [passbookCopied, setPassbookCopied] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);

  if (!payment) return null;

  // Retrieve or generate persistent passbook tracking token for this customer loan
  const passbookToken = loan
    ? (financeStore.getState().tokens.find((t) => t.loanId === loan.id && !t.isRevoked)?.token ||
       financeStore.generatePassbookToken(loan.customerId, loan.id).token)
    : null;

  const passbookUrl = passbookToken ? `${window.location.origin}/?track=${passbookToken}` : undefined;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment.paymentDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleSendWhatsApp = () => {
    sendWhatsAppInvoice({
      payment,
      customer,
      loan,
      coveredWeeksText: currentDueText,
      remainingBalance: loan
        ? loan.loanType === 'sp_interest_only'
          ? loan.outstandingPrincipal + loan.outstandingInterest
          : loan.outstandingWeeklyDues
        : undefined,
      passbookUrl,
    });
  };

  const handleCopyWhatsAppText = () => {
    const text = formatWhatsAppInvoiceText({
      payment,
      customer,
      loan,
      coveredWeeksText: currentDueText,
      remainingBalance: loan
        ? loan.loanType === 'sp_interest_only'
          ? loan.outstandingPrincipal + loan.outstandingInterest
          : loan.outstandingWeeklyDues
        : undefined,
      passbookUrl,
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#0c1322] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden neon-glow-cyan text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 no-print shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-base font-semibold text-white font-display">Payment Receipt Generated</h3>
              <p className="text-[11px] text-slate-400">Official voucher with instant WhatsApp delivery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="overflow-y-auto p-6 space-y-4">
          
          {/* Printable Receipt Body */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 print-receipt-container" id="printable-receipt">
            {/* Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-700">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white font-display">
                SRI SENNAMAL FINANCE
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Coimbatore, Tamil Nadu · Ph: 7812834522
              </p>
              <span className="inline-block mt-2 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/50 rounded-full border border-cyan-500/20">
                Official Payment Receipt
              </span>
            </div>

            {/* Exactly 8 Specified Receipt Fields */}
            <div className="py-3.5 space-y-2.5 text-xs">
              
              {/* 1. Receipt No */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 uppercase tracking-wider text-[11px]">1. Receipt No</span>
                <span className="font-mono font-bold text-cyan-400">{payment.receiptNo}</span>
              </div>

              {/* 2. Loan ID */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 uppercase tracking-wider text-[11px]">2. Loan ID</span>
                <span className="font-mono font-medium text-slate-200">{loanIdText}</span>
              </div>

              {/* 3. Date */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 uppercase tracking-wider text-[11px]">3. Date</span>
                <span className="text-slate-200">{formattedDate}</span>
              </div>

              {/* 4. Customer Name */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 uppercase tracking-wider text-[11px]">4. Customer Name</span>
                <div className="text-right">
                  <span className="font-semibold text-white block">{customerName}</span>
                  {customer?.phone && (
                    <span className="font-mono text-[10px] text-slate-400">{customer.phone}</span>
                  )}
                </div>
              </div>

              {/* 5. Current Due (e.g. Week 1, Week 2, or Week 1–10) */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 uppercase tracking-wider text-[11px]">5. Current Due</span>
                <span className="font-semibold text-purple-300">{currentDueText}</span>
              </div>

              {/* 6. Amount Received */}
              <div className="flex justify-between items-center py-2 bg-cyan-950/40 px-3 rounded-lg border border-cyan-500/30">
                <span className="font-semibold text-cyan-300 uppercase tracking-wider text-[11px]">6. Amount Received</span>
                <span className="text-base font-bold text-cyan-300 font-tabular">
                  {formatIndianCurrency(payment.amount, true)}
                </span>
              </div>

              {/* 7. Reference Number */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400 uppercase tracking-wider text-[11px]">7. Reference Number</span>
                <span className="font-mono text-slate-300">{payment.referenceNo || 'CASH-COLLECT'}</span>
              </div>

              {/* 8. Payment Method */}
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 uppercase tracking-wider text-[11px]">8. Payment Method</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700">
                  {payment.paymentMethod}
                </span>
              </div>

              {/* Authorized Collector */}
              <div className="flex justify-between items-center py-1 border-t border-slate-800/60 pt-1.5">
                <span className="text-slate-400 uppercase tracking-wider text-[11px]">Authorized Collector</span>
                <span className="font-medium text-slate-200">
                  {payment.collectorName || 'K. Sakthi Kumar'}
                </span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-2.5 border-t border-dashed border-slate-700 text-center text-[10px] text-slate-400">
              Thank you for your prompt repayment. Official ledger copy.
            </div>
          </div>

          {/* WhatsApp Action Card */}
          <div className="p-3.5 rounded-xl bg-[#064e3b]/30 border border-emerald-500/40 flex flex-col gap-2 no-print">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-300 block">WhatsApp Invoice Send System</span>
                  <span className="text-[10px] text-emerald-400/80">
                    Send to: {customer?.phone ? customer.phone : 'Customer WhatsApp'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyWhatsAppText}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50 flex items-center gap-1 transition-colors"
                  title="Copy formatted invoice text"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
                  className="text-[10px] text-emerald-400 underline"
                >
                  {showWhatsAppPreview ? 'Hide preview' : 'View preview'}
                </button>
              </div>
            </div>

            {showWhatsAppPreview && (
              <pre className="p-3 rounded-lg bg-slate-950 text-slate-300 text-[10px] font-mono whitespace-pre-wrap max-h-40 overflow-y-auto border border-emerald-500/20">
                {formatWhatsAppInvoiceText({
                  payment,
                  customer,
                  loan,
                  coveredWeeksText: currentDueText,
                  remainingBalance: loan
                    ? loan.loanType === 'sp_interest_only'
                      ? loan.outstandingPrincipal + loan.outstandingInterest
                      : loan.outstandingWeeklyDues
                    : undefined,
                  passbookUrl,
                })}
              </pre>
            )}
          </div>

          {/* Customer Self-Service Passbook Card */}
          {passbookUrl && (
            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex flex-col gap-2.5 no-print">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-cyan-300 block">Customer Online Passbook</span>
                    <span className="text-[10px] text-slate-400">
                      Isolated Borrower View · Zero Login Required
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(passbookUrl);
                      setPassbookCopied(true);
                      setTimeout(() => setPassbookCopied(false), 3000);
                    }}
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Copy Borrower Passbook Link"
                  >
                    {passbookCopied ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                    <span>{passbookCopied ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={passbookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                    <span>Open Passbook</span>
                  </a>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-black/40 border border-slate-800 text-[10px] font-mono text-cyan-400/90 truncate select-all">
                {passbookUrl}
              </div>

              <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Strict privacy: Borrower sees only their loan. Other loans and admin desk remain hidden.</span>
              </p>
            </div>
          )}

        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-slate-900/90 border-t border-slate-800 no-print shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950 border border-cyan-500/40 hover:bg-cyan-900/50 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Send WhatsApp Invoice
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
