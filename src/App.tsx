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
import { LoginPage } from './components/LoginPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { ReceiptModal } from './components/ReceiptModal';
import { PaymentCollectionModal } from './components/PaymentCollectionModal';
import { ClearDataModal } from './components/ClearDataModal';
import { NavigationDrawer } from './components/NavigationDrawer';
import { BottomNav } from './components/BottomNav';
import { CustomerPassbookView } from './components/CustomerPassbookView';
import { UserProfileModal } from './components/UserProfileModal';
import { financeStore } from './services/financeStore';
import { Customer, Loan, Payment, PassbookData, UserProfile, ROLE_PERMISSIONS } from './types/finance';
import { DESIGNATED_OWNER_EMAIL, getSupabaseClient, isAuthorizedOwner } from './services/supabase';
import { userService, subscribeToUserProfiles } from './services/userService';
import { formatCoveredWeeksSummary } from './utils/financeCalculations';
import { MouseAtmosphere } from './components/MouseAtmosphere';

export default function App() {
  const [storeState, setStoreState] = useState(() => financeStore.getState());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals & Active View State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isClearDataOpen, setIsClearDataOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [preSelectedLoanId, setPreSelectedLoanId] = useState<string | undefined>(undefined);

  // Current User Profile & Role Permissions
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(() =>
    userService.getProfileByEmail(financeStore.getState().currentUserEmail)
  );

  useEffect(() => {
    setCurrentProfile(userService.getProfileByEmail(storeState.currentUserEmail));
    const unsubscribe = subscribeToUserProfiles(() => {
      setCurrentProfile(userService.getProfileByEmail(storeState.currentUserEmail));
    });
    return unsubscribe;
  }, [storeState.currentUserEmail]);

  // Auto-redirect collection team if navigating to a restricted view
  useEffect(() => {
    if (currentProfile.role === 'collection_team') {
      const restrictedForAgent = ['refunds', 'ledger', 'reports', 'autosave', 'tests', 'settings'];
      if (restrictedForAgent.includes(currentTab)) {
        setCurrentTab('collections');
      }
    } else if (currentProfile.role === 'manager') {
      const restrictedForManager = ['autosave', 'tests', 'settings'];
      if (restrictedForManager.includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    }
  }, [currentProfile.role, currentTab]);
  
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

  // Listen to Supabase Auth state changes
  useEffect(() => {
    let isMounted = true;
    const client = getSupabaseClient();
    if (!client) return;

    client.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user?.email) {
        financeStore.setOwnerSession(session.user.email);
      }
    }).catch((err) => {
      console.warn('Error fetching Supabase session:', err);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY') {
        setIsResetPasswordOpen(true);
        setIsPassbookInvalid(false);
        setPassbookToken(null);
        setPassbookData(null);
      }
      if (session?.user?.email) {
        financeStore.setOwnerSession(session.user.email);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // 5-Minute Inactivity (AFK Mode) Auto-Logout & Tab Close Protection
  const [afkNotice, setAfkNotice] = useState<string | null>(null);

  const handleLogout = async () => {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (err) {
        console.warn('Supabase sign out error:', err);
      }
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sri_sennamal_auth_session');
    }
    financeStore.setOwnerSession(null);
  };

  // AFK Inactivity Auto-Logout Effect (10 Minutes)
  useEffect(() => {
    if (!storeState.currentUserEmail) return;

    let lastActivity = Date.now();
    const AFK_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

    const recordActivity = () => {
      lastActivity = Date.now();
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, recordActivity, { passive: true });
    });

    const intervalTimer = setInterval(() => {
      const idleTime = Date.now() - lastActivity;
      if (idleTime >= AFK_LIMIT_MS) {
        clearInterval(intervalTimer);
        setAfkNotice('Session expired: You have been automatically logged out due to 10 minutes of inactivity (AFK Mode).');
        handleLogout();
      }
    }, 5000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, recordActivity);
      });
      clearInterval(intervalTimer);
    };
  }, [storeState.currentUserEmail]);

  // Tab Close / Window Close Protection
  useEffect(() => {
    const handleTabUnload = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sri_sennamal_auth_session');
      }
    };

    window.addEventListener('beforeunload', handleTabUnload);
    window.addEventListener('pagehide', handleTabUnload);

    return () => {
      window.removeEventListener('beforeunload', handleTabUnload);
      window.removeEventListener('pagehide', handleTabUnload);
    };
  }, []);

  // Inspect URL for public customer passbook token (?track=TOKEN or #track=TOKEN) or Supabase password reset link
  useEffect(() => {
    const handleUrlCheck = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      // 1. Check if arriving via Supabase Password Recovery / Magic link / Reset link / Auth callback
      const isRecovery =
        hash.includes('reset-password') ||
        hash.includes('type=recovery') ||
        search.includes('type=recovery') ||
        hash.includes('type=magiclink') ||
        search.includes('type=magiclink') ||
        (hash.includes('access_token=') && !hash.includes('track=')) ||
        (search.includes('code=') && !urlParams.has('track')) ||
        (hash.includes('error=') && (hash.includes('error_code=') || hash.includes('error_description=')));

      if (isRecovery) {
        setIsResetPasswordOpen(true);
        setPassbookToken(null);
        setPassbookData(null);
        setIsPassbookInvalid(false);
        return; // Recovery link takes absolute precedence. Never check passbook for recovery links!
      }

      // 2. Strict Passbook Token extraction (ONLY from valid ?track=TOKEN or #track=TOKEN)
      let token: string | null = urlParams.get('track');

      if (!token && hash) {
        if (hash.startsWith('#track=')) {
          token = hash.replace('#track=', '').trim();
        } else {
          // If hash is structured as #?track=TOKEN or #param1=val&track=TOKEN
          const cleanHash = hash.replace(/^[#?]+/, '');
          const hashParams = new URLSearchParams(cleanHash);
          const trackVal = hashParams.get('track');
          if (trackVal) {
            token = trackVal.trim();
          }
        }
      }

      // Check for valid passbook token (must not be empty and must not look like an auth token payload)
      if (token && !token.includes('access_token=') && !token.includes('type=') && !token.includes('code=')) {
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

  // 1. DEDICATED SUPABASE RESET PASSWORD PAGE (Absolute top priority over passbook and login)
  if (isResetPasswordOpen) {
    return (
      <ResetPasswordPage
        onBackToLogin={() => {
          setIsResetPasswordOpen(false);
          setIsPassbookInvalid(false);
          setPassbookToken(null);
          window.history.pushState({}, '', window.location.pathname);
        }}
        onSuccess={(email) => {
          setIsResetPasswordOpen(false);
          setIsPassbookInvalid(false);
          setPassbookToken(null);
          if (email) {
            financeStore.setOwnerSession(email);
          }
          window.history.pushState({}, '', window.location.pathname);
        }}
      />
    );
  }

  // 2. If viewing public customer passbook, isolate interface completely
  if (passbookToken || isPassbookInvalid) {
    return (
      <CustomerPassbookView
        passbookData={passbookData}
        tokenRevokedOrInvalid={isPassbookInvalid}
        onExitToPortal={handleExitPassbook}
      />
    );
  }

  // FIRST: If owner is not logged in, show dedicated Supabase Login Page first!
  if (!storeState.currentUserEmail) {
    return (
      <LoginPage
        onLoginSuccess={(email) => {
          setAfkNotice(null);
          financeStore.setOwnerSession(email);
        }}
        onOpenResetPage={() => setIsResetPasswordOpen(true)}
        afkNotice={afkNotice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 relative overflow-x-hidden">
      
      {/* Interactive Gold & Electric Blue Animated Atmosphere & Mouse Follower */}
      <MouseAtmosphere />

      {/* Main Content Viewport */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Header */}
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          autoSaveStatus={storeState.autoSaveStatus}
          ownerEmail={storeState.currentUserEmail}
          userProfile={currentProfile}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={handleLogout}
          onOpenNewCollection={() => setIsPaymentModalOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
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
              canManageCustomers={ROLE_PERMISSIONS[currentProfile.role]?.canManageCustomers ?? false}
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
              canCreateLoan={ROLE_PERMISSIONS[currentProfile.role]?.canCreateLoan ?? false}
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
            (ROLE_PERMISSIONS[currentProfile.role]?.canIssueRefunds ?? false) ? (
              <RefundsSection
                payments={storeState.payments}
                refunds={storeState.refunds}
                loans={storeState.loans}
                customers={storeState.customers}
                onIssueRefund={(params) => financeStore.issueRefund(params)}
              />
            ) : (
              <div className="max-w-xl mx-auto p-8 rounded-2xl neon-card text-center space-y-3 border border-amber-500/30 my-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center text-xl font-bold">
                  🔒
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  Refunds Restricted (அனுமதி வரம்பு)
                </h3>
                <p className="text-xs text-slate-300">
                  Logged in as <strong>{currentProfile.displayName}</strong> [{currentProfile.role.toUpperCase()}]. Refunds and reversals require Administrator or Manager role.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentTab('collections')}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer"
                  >
                    Back to Collections Desk
                  </button>
                </div>
              </div>
            )
          )}

          {currentTab === 'ledger' && (
            (ROLE_PERMISSIONS[currentProfile.role]?.canViewLedger ?? false) ? (
              <CustomerLedgerView
                ledger={storeState.ledger}
                loans={storeState.loans}
                customers={storeState.customers}
              />
            ) : (
              <div className="max-w-xl mx-auto p-8 rounded-2xl neon-card text-center space-y-3 border border-amber-500/30 my-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center text-xl font-bold">
                  🔒
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  Ledger Restricted (பேரேடு அனுமதி வரம்பு)
                </h3>
                <p className="text-xs text-slate-300">
                  Logged in as <strong>{currentProfile.displayName}</strong> [{currentProfile.role.toUpperCase()}]. Viewing detailed borrower ledgers requires Administrator or Manager role.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentTab('collections')}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer"
                  >
                    Back to Collections Desk
                  </button>
                </div>
              </div>
            )
          )}

          {currentTab === 'reports' && (
            (ROLE_PERMISSIONS[currentProfile.role]?.canViewFinancialReports ?? false) ? (
              <ReportsView
                payments={storeState.payments}
                refunds={storeState.refunds}
                loans={storeState.loans}
                customers={storeState.customers}
                installments={storeState.installments}
              />
            ) : (
              <div className="max-w-xl mx-auto p-8 rounded-2xl neon-card text-center space-y-3 border border-amber-500/30 my-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center text-xl font-bold">
                  🔒
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  Financial Reports Restricted (அறிக்கைகள் அனுமதி வரம்பு)
                </h3>
                <p className="text-xs text-slate-300">
                  Financial collection reports and metrics are accessible exclusively to Manager and Administrator accounts.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentTab('collections')}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer"
                  >
                    Back to Collections Desk
                  </button>
                </div>
              </div>
            )
          )}

          {currentTab === 'autosave' && (
            currentProfile.role === 'admin' ? (
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
            ) : (
              <div className="max-w-xl mx-auto p-8 rounded-2xl neon-card text-center space-y-3 border border-purple-500/30 my-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-400 mx-auto flex items-center justify-center text-xl font-bold">
                  🔒
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  System Backup Restricted to Administrator
                </h3>
                <p className="text-xs text-slate-300">
                  Database backups and system recovery points are managed exclusively by the Administrator.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentTab('collections')}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer"
                  >
                    Back to Collections Desk
                  </button>
                </div>
              </div>
            )
          )}

          {currentTab === 'tests' && (
            currentProfile.role === 'admin' ? (
              <AutomatedTestsView />
            ) : (
              <div className="max-w-xl mx-auto p-8 rounded-2xl neon-card text-center space-y-3 border border-purple-500/30 my-8">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-400 mx-auto flex items-center justify-center text-xl font-bold">
                  🔒
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  Automated Tests Restricted to Administrator
                </h3>
                <p className="text-xs text-slate-300">
                  Financial calculation test suites are reserved for Administrator verification.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setCurrentTab('collections')}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer"
                  >
                    Back to Collections Desk
                  </button>
                </div>
              </div>
            )
          )}

          {currentTab === 'settings' && (
            (ROLE_PERMISSIONS[currentProfile.role]?.canManageSettings ?? false) ? (
              <SettingsView
                businessInfo={storeState.businessInfo}
                onUpdateBusinessInfo={(info) => financeStore.updateBusinessInfo(info)}
                ownerEmail={storeState.currentUserEmail}
                onOpenClearData={() => setIsClearDataOpen(true)}
                onOpenProfile={() => setIsProfileModalOpen(true)}
              />
            ) : (
              <div className="max-w-xl mx-auto p-8 rounded-2xl neon-card text-center space-y-3 border border-amber-500/30 my-8">
                <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-400 mx-auto flex items-center justify-center text-xl font-bold">
                  🔒
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  Settings Restricted to Administrator
                </h3>
                <p className="text-xs text-slate-300">
                  Business configuration, licences, and team roles are managed exclusively by the Administrator. You can update your personal profile, avatar photo, and password below.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsProfileModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs cursor-pointer"
                  >
                    Open My Profile
                  </button>
                  <button
                    onClick={() => setCurrentTab('collections')}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 cursor-pointer"
                  >
                    Collections Desk
                  </button>
                </div>
              </div>
            )
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
          userProfile={currentProfile}
          businessAddress={storeState.businessInfo.address || '45 Bazaar Street, Salem, Tamil Nadu, ...'}
          onOpenClearData={() => setIsClearDataOpen(true)}
          onLogout={handleLogout}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

      </div>

      {/* --- MODALS --- */}
      
      {/* 0. User Profile & Account Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUserEmail={storeState.currentUserEmail}
      />

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

      {/* 4. Clear All Data (Factory Reset) Modal — Strictly Admin Only */}
      {currentProfile.role === 'admin' && (
        <ClearDataModal
          isOpen={isClearDataOpen}
          onClose={() => setIsClearDataOpen(false)}
          customerCount={storeState.customers.length}
          loanCount={storeState.loans.length}
          paymentCount={storeState.payments.length}
          onCleared={() => setCurrentTab('dashboard')}
        />
      )}

    </div>
  );
}
