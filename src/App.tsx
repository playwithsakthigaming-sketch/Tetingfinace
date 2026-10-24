/**
 * Sri Sennamal Finance — Production Weekly Loan & Finance Platform
 * Complete full-stack management, Dark Neon Saraswati Theme,
 * automated Wednesday penalties, customer passbook links, and Supabase integration.
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { CustomerManagement } from './components/CustomerManagement';
import { LoanManagement } from './components/LoanManagement';
import { MultipleDueEntryView } from './components/MultipleDueEntryView';
import { RefundsSection } from './components/RefundsSection';
import { CustomerLedgerView } from './components/CustomerLedgerView';
import { ReportsView } from './components/ReportsView';
import { AutoSaveRestoreView } from './components/AutoSaveRestoreView';
import { SettingsView } from './components/SettingsView';
import { AutomatedTestsView } from './components/AutomatedTestsView';
import { OwnerLoginModal } from './components/OwnerLoginModal';
import { ReceiptModal } from './components/ReceiptModal';
import { PaymentCollectionModal } from './components/PaymentCollectionModal';
import { ClearDataModal } from './components/ClearDataModal';
import { NavigationDrawer } from './components/NavigationDrawer';
import { BottomNav } from './components/BottomNav';
import { CustomerPassbookView } from './components/CustomerPassbookView';
import { financeStore } from './services/financeStore';
import { Customer, Loan, Payment, PassbookData } from './types/finance';
import { DESIGNATED_OWNER_EMAIL } from './services/supabase';
import { formatCoveredWeeksSummary } from './utils/financeCalculations';

export default function App() {
  const [storeState, setStoreState] = useState(() => financeStore.getState());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals & Active View State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isClearDataOpen, setIsClearDataOpen] = useState(false);
  const [preSelectedLoanId, setPreSelectedLoanId] = useState<string | undefined>(undefined);
  
  // Receipt Modal
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<Payment | null>(null);

  // Public Passbook Tracking Mode (?track=TOKEN or #track=TOKEN)
  const [passbookToken, setPassbookToken] = useState<string | null>(null);
  const [passbookData, setPassbookData] = useState<PassbookData | null>(null);
  const [isPassbookInvalid, setIsPassbookInvalid] = useState(false);

  // Subscribe to central Finance Store updates
  useEffect(() => {
    const unsubscribe = financeStore.subscribe(() => {
      setStoreState({ ...financeStore.getState() });
    });
    return unsubscribe;
  }, []);

  // Inspect URL for public customer passbook token (?track=TOKEN or #track=TOKEN)
  useEffect(() => {
    const handleUrlCheck = () => {
      const urlParams = new URLSearchParams(window.location.search);
      let token = urlParams.get('track');

      if (!token && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        token = hashParams.get('track') || window.location.hash.replace('#track=', '');
      }

      if (token) {
        setPassbookToken(token);
        const data = financeStore.getPassbookDataByToken(token);
        if (data) {
          setPassbookData(data);
          setIsPassbookInvalid(false);
        } else {
          setPassbookData(null);
          setIsPassbookInvalid(true);
        }
      } else {
        setPassbookToken(null);
        setPassbookData(null);
        setIsPassbookInvalid(false);
      }
    };

    handleUrlCheck();
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, [storeState.tokens]);

  const handleOpenPassbookInApp = (tokenStr: string) => {
    const data = financeStore.getPassbookDataByToken(tokenStr);
    if (data) {
      setPassbookToken(tokenStr);
      setPassbookData(data);
      setIsPassbookInvalid(false);
      window.history.pushState({}, '', `?track=${tokenStr}`);
    } else {
      setIsPassbookInvalid(true);
    }
  };

  const handleExitPassbook = () => {
    setPassbookToken(null);
    setPassbookData(null);
    setIsPassbookInvalid(false);
    window.history.pushState({}, '', window.location.pathname);
  };

  // Receipt Modal Helper
  const handleViewReceipt = (payment: Payment) => {
    setActiveReceiptPayment(payment);
  };

  const receiptLoan = activeReceiptPayment
    ? storeState.loans.find((l) => l.id === activeReceiptPayment.loanId)
    : null;
  const receiptCustomer = activeReceiptPayment
    ? storeState.customers.find((c) => c.id === activeReceiptPayment.customerId)
    : null;
  const receiptCoveredWeeksText = activeReceiptPayment
    ? formatCoveredWeeksSummary(activeReceiptPayment.allocations.coveredWeeks)
    : 'Weekly Due';

  // If viewing public customer passbook, isolate interface completely
  if (passbookToken || isPassbookInvalid) {
    return (
      <CustomerPassbookView
        passbookData={passbookData}
        tokenRevokedOrInvalid={isPassbookInvalid}
        onExitToPortal={handleExitPassbook}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 relative overflow-x-hidden">
      
      {/* Respectful Saraswati Themed Background Watermark & Light Glow Accents */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Deep ambient radial glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-900/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-900/15 rounded-full blur-3xl" />
        
        {/* Respectful Sacred Geometry / Veena & Lotus Watermark Overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.035] select-none">
          <svg width="600" height="600" viewBox="0 0 200 200" fill="none" stroke="currentColor">
            <circle cx="100" cy="100" r="80" strokeWidth="1" strokeDasharray="4 4" className="text-cyan-400" />
            <circle cx="100" cy="100" r="60" strokeWidth="1.5" className="text-purple-400" />
            <polygon points="100,25 125,75 180,75 135,110 155,165 100,135 45,165 65,110 20,75 75,75" strokeWidth="1" className="text-cyan-300" />
            <ellipse cx="100" cy="100" rx="40" ry="20" strokeWidth="1" className="text-purple-300" />
          </svg>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          autoSaveStatus={storeState.autoSaveStatus}
          ownerEmail={storeState.currentUserEmail}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={() => financeStore.setOwnerSession(null)}
          onOpenNewCollection={() => setIsPaymentModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(true)}
        />

        {/* Main Body */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6">
          {currentTab === 'dashboard' && (
            <Dashboard
              customers={storeState.customers}
              loans={storeState.loans}
              installments={storeState.installments}
              payments={storeState.payments}
              refunds={storeState.refunds}
              onOpenPaymentModal={(loanId) => {
                setPreSelectedLoanId(loanId);
                setIsPaymentModalOpen(true);
              }}
              onOpenMultipleDue={(loanId) => {
                setPreSelectedLoanId(loanId);
                setCurrentTab('multiple_due');
              }}
              onOpenNewLoan={() => setCurrentTab('loans')}
              onOpenNewCustomer={() => setCurrentTab('customers')}
              onSelectTab={setCurrentTab}
              onRunPenaltyCheck={() => financeStore.checkAndAssessDuePenalties()}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {currentTab === 'customers' && (
            <CustomerManagement
              customers={storeState.customers}
              loans={storeState.loans}
              payments={storeState.payments}
              tokens={storeState.tokens}
              onAddCustomer={(data) => financeStore.addCustomer(data)}
              onUpdateCustomer={(id, updates) => financeStore.updateCustomer(id, updates)}
              onToggleStatus={(id) => financeStore.toggleCustomerStatus(id)}
              onGenerateToken={(custId, loanId) => financeStore.generatePassbookToken(custId, loanId)}
              onRevokeToken={(tokenId) => financeStore.revokePassbookToken(tokenId)}
              onOpenPassbookInApp={handleOpenPassbookInApp}
              onSelectCustomerLoan={(loanId) => {
                setPreSelectedLoanId(loanId);
                setCurrentTab('loans');
              }}
            />
          )}

          {currentTab === 'loans' && (
            <LoanManagement
              loans={storeState.loans}
              customers={storeState.customers}
              tokens={storeState.tokens}
              onCreateLoan={(params) => financeStore.createLoan(params)}
              onOpenPayment={(loanId) => {
                setPreSelectedLoanId(loanId);
                setIsPaymentModalOpen(true);
              }}
              onOpenMultipleDue={(loanId) => {
                setPreSelectedLoanId(loanId);
                setCurrentTab('multiple_due');
              }}
              onOpenPassbookInApp={handleOpenPassbookInApp}
            />
          )}

          {currentTab === 'collections' && (
            <div className="space-y-6">
              {/* Full Payment Collection & Transactions Panel matching screenshot */}
              <PaymentCollectionModal
                isOpen={true}
                isEmbedded={true}
                onClose={() => {}}
                loans={storeState.loans}
                customers={storeState.customers}
                installments={storeState.installments}
                preSelectedLoanId={preSelectedLoanId}
                onCollectWeeklyDues={(params) => financeStore.collectWeeklyDues(params)}
                onCollectSPPayment={(params) => financeStore.collectSPLoanPayment(params)}
                onViewReceipt={handleViewReceipt}
                onSwitchTab={setCurrentTab}
              />

              {/* Recent Collections Audit Table */}
              <div className="rounded-2xl neon-card p-5 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white font-display">Recent Collections & Transactions Log</h3>
                  <span className="text-xs text-cyan-400 font-mono">{storeState.payments.length} Payments on Record</span>
                </div>
                <div className="overflow-x-auto mt-3">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Receipt No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Loan ID</th>
                        <th className="py-2.5 px-3">Borrower</th>
                        <th className="py-2.5 px-3">Due Description</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                        <th className="py-2.5 px-3 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-tabular">
                      {storeState.payments.map((p) => {
                        const cust = storeState.customers.find((c) => c.id === p.customerId);
                        const l = storeState.loans.find((item) => item.id === p.loanId);
                        return (
                          <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-3 font-mono font-medium text-cyan-400">
                              {p.receiptNo}
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </td>
                            <td className="py-3 px-3 text-slate-200">
                              {l?.loanId || p.loanId}
                            </td>
                            <td className="py-3 px-3 font-semibold text-white">
                              {cust?.fullName || 'Customer'}
                            </td>
                            <td className="py-3 px-3 text-purple-300">
                              {p.notes || 'Weekly Due'}
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                {p.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-emerald-400">
                              ₹{p.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleViewReceipt(p)}
                                className="px-2.5 py-1 text-[11px] font-medium text-cyan-400 hover:text-black hover:bg-cyan-400 rounded transition-colors border border-cyan-500/30"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'multiple_due' && (
            <MultipleDueEntryView
              loans={storeState.loans}
              customers={storeState.customers}
              installments={storeState.installments}
              preSelectedLoanId={preSelectedLoanId}
              onCollectDues={(params) => financeStore.collectWeeklyDues(params)}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {currentTab === 'refunds' && (
            <RefundsSection
              payments={storeState.payments}
              refunds={storeState.refunds}
              loans={storeState.loans}
              customers={storeState.customers}
              onIssueRefund={(params) => financeStore.issueRefund(params)}
            />
          )}

          {currentTab === 'ledger' && (
            <CustomerLedgerView
              ledger={storeState.ledger}
              loans={storeState.loans}
              customers={storeState.customers}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              payments={storeState.payments}
              refunds={storeState.refunds}
              loans={storeState.loans}
              customers={storeState.customers}
              installments={storeState.installments}
            />
          )}

          {currentTab === 'autosave' && (
            <AutoSaveRestoreView
              autoSaveStatus={storeState.autoSaveStatus}
              lastSavedAt={storeState.lastSavedAt}
              recoveryPoints={storeState.recoveryPoints}
              onTriggerAutoSave={() => financeStore.triggerAutoSave()}
              onCreateRecoveryPoint={(note) => financeStore.createRecoveryPoint(note)}
              onRestoreRecoveryPoint={(id) => financeStore.restoreRecoveryPoint(id)}
              ownerEmail={storeState.currentUserEmail}
              onOpenClearData={() => setIsClearDataOpen(true)}
            />
          )}

          {currentTab === 'tests' && <AutomatedTestsView />}

          {currentTab === 'settings' && (
            <SettingsView
              businessInfo={storeState.businessInfo}
              onUpdateBusinessInfo={(info) => financeStore.updateBusinessInfo(info)}
              ownerEmail={storeState.currentUserEmail}
              onOpenClearData={() => setIsClearDataOpen(true)}
            />
          )}
        </main>

        {/* Quiet Footer */}
        <footer className="mt-12 mb-16 border-t border-slate-800/80 bg-[#070b14]/70 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Sri Sennamal Finance · Coimbatore, Tamil Nadu · Helpline: 7812834522</span>
            <span>{storeState.businessInfo.licenceNumber}</span>
          </div>
        </footer>

        {/* Fixed Mobile Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenCollect={() => setIsPaymentModalOpen(true)}
          onOpenMenu={() => setIsSidebarOpen(true)}
        />

        {/* Slide-out Navigation Drawer */}
        <NavigationDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          ownerEmail={storeState.currentUserEmail}
          onOpenClearData={() => setIsClearDataOpen(true)}
        />

      </div>

      {/* --- MODALS --- */}
      
      {/* 1. Simplified 8-Field Receipt Modal */}
      <ReceiptModal
        payment={activeReceiptPayment}
        customerName={receiptCustomer?.fullName || 'Customer'}
        loanIdText={receiptLoan?.loanId || activeReceiptPayment?.loanId || 'N/A'}
        currentDueText={receiptCoveredWeeksText}
        onClose={() => setActiveReceiptPayment(null)}
        customer={receiptCustomer}
        loan={receiptLoan}
      />

      {/* 2. Payment Collection Modal */}
      <PaymentCollectionModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        loans={storeState.loans}
        customers={storeState.customers}
        installments={storeState.installments}
        preSelectedLoanId={preSelectedLoanId}
        onCollectWeeklyDues={(params) => financeStore.collectWeeklyDues(params)}
        onCollectSPPayment={(params) => financeStore.collectSPLoanPayment(params)}
        onViewReceipt={handleViewReceipt}
      />

      {/* 3. Owner Login Modal */}
      <OwnerLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(email) => {
          financeStore.setOwnerSession(email);
          setIsLoginOpen(false);
        }}
      />

      {/* 4. Clear All Data (Factory Reset) Modal */}
      <ClearDataModal
        isOpen={isClearDataOpen}
        onClose={() => setIsClearDataOpen(false)}
        customerCount={storeState.customers.length}
        loanCount={storeState.loans.length}
        paymentCount={storeState.payments.length}
        onCleared={() => setCurrentTab('dashboard')}
      />

    </div>
  );
}
