/**
 * Sri Sennamal Finance — Central Financial Data Store & Persistence Service
 * Handles persistent state, auto-save, recovery points, audit logging,
 * and strict business rules enforcement.
 */

import {
  AuditLog,
  BusinessInfo,
  Customer,
  CustomerAccessToken,
  Installment,
  LedgerTransaction,
  Loan,
  PassbookData,
  Payment,
  RecoveryPoint,
  Refund,
} from '../types/finance';
import {
  calculateMultipleDueAllocation,
  evaluateInstallmentPenalty,
  formatCoveredWeeksSummary,
  generateWeeklySchedule,
  generateDailySchedule,
  PENALTY_AMOUNT,
} from '../utils/financeCalculations';
import { DESIGNATED_OWNER_EMAIL, runHealthCheck } from './supabase';

const STORAGE_KEY = 'sri_sennamal_finance_store_v1';
const RECOVERY_STORAGE_KEY = 'sri_sennamal_finance_recovery_v1';
const STORAGE_CLEARED_FLAG = 'sri_sennamal_finance_cleared_flag_v1';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface FinanceState {
  businessInfo: BusinessInfo;
  customers: Customer[];
  loans: Loan[];
  installments: Installment[];
  payments: Payment[];
  refunds: Refund[];
  ledger: LedgerTransaction[];
  tokens: CustomerAccessToken[];
  auditLogs: AuditLog[];
  recoveryPoints: RecoveryPoint[];
  autoSaveStatus: AutoSaveStatus;
  lastSavedAt: string | null;
  currentUserEmail: string | null;
}

// Initial Seeds with realistic Coimbatore weekly loan cases
const DEFAULT_BUSINESS_INFO: BusinessInfo = {
  companyName: 'Sri Sennamal Finance',
  phone: '7812834522',
  email: 'playwithsakthigaming@gmail.com',
  address: 'Coimbatore, Tamil Nadu, India',
  currency: 'INR',
  currencySymbol: '₹',
  timezone: 'Asia/Kolkata',
  licenceNumber: 'Licence No: Not provided',
  licenceVerified: false,
};

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1001',
    uniqueId: 'CUST-1001',
    fullName: 'R. Murugesan',
    phone: '9842100001',
    address: 'Gandhipuram, Coimbatore, Tamil Nadu',
    loanStartDate: '2026-09-06',
    notes: 'Textile shop owner, weekly collection',
    status: 'active',
    createdAt: '2026-09-06T09:00:00.000Z',
    updatedAt: '2026-09-06T09:00:00.000Z',
  },
  {
    id: 'cust-1002',
    uniqueId: 'CUST-1002',
    fullName: 'S. Lakshmi',
    phone: '9842100002',
    address: 'RS Puram, Coimbatore, Tamil Nadu',
    loanStartDate: '2026-09-13',
    notes: 'Provision store owner',
    status: 'active',
    createdAt: '2026-09-13T10:00:00.000Z',
    updatedAt: '2026-09-13T10:00:00.000Z',
  },
  {
    id: 'cust-1003',
    uniqueId: 'CUST-1003',
    fullName: 'P. Karthik',
    phone: '9842100003',
    address: 'Peelamedu, Coimbatore, Tamil Nadu',
    loanStartDate: '2026-09-20',
    notes: 'SP Monthly Interest Loan (2% / mo)',
    status: 'active',
    createdAt: '2026-09-20T11:00:00.000Z',
    updatedAt: '2026-09-20T11:00:00.000Z',
  },
  {
    id: 'cust-1004',
    uniqueId: 'CUST-1004',
    fullName: 'M. Kavitha',
    phone: '9842100004',
    address: 'Singanallur, Coimbatore, Tamil Nadu',
    loanStartDate: '2026-08-02',
    notes: 'Tailoring unit - Loan settled',
    status: 'active',
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z',
  },
];

const INITIAL_LOANS: Loan[] = [
  {
    id: 'loan-001',
    loanId: 'LN-2026-001',
    customerId: 'cust-1001',
    loanType: 'standard_weekly',
    originalPrincipal: 5000,
    actualDisbursement: 5000,
    weeklyDueAmount: 500,
    loanStartDate: '2026-09-06',
    tenureWeeks: 10,
    interestMethod: 'flat',
    interestRateMonthly: 0,
    penaltyRules: {
      weeklyDueDate: 'Sunday',
      gracePeriodDays: 2,
      penaltyApplyDay: 'Wednesday',
      penaltyAmount: 150,
    },
    status: 'active',
    outstandingPrincipal: 5000,
    outstandingWeeklyDues: 2500,
    outstandingInterest: 0,
    outstandingPenalties: 150,
    totalPaidPrincipal: 2500,
    totalPaidDues: 2500,
    totalPaidInterest: 0,
    totalPaidPenalties: 0,
    createdAt: '2026-09-06T09:30:00.000Z',
    updatedAt: '2026-10-18T10:00:00.000Z',
  },
  {
    id: 'loan-002',
    loanId: 'LN-2026-002',
    customerId: 'cust-1002',
    loanType: 'standard_weekly',
    originalPrincipal: 10000,
    actualDisbursement: 10000,
    weeklyDueAmount: 1000,
    loanStartDate: '2026-09-13',
    tenureWeeks: 10,
    interestMethod: 'flat',
    interestRateMonthly: 0,
    penaltyRules: {
      weeklyDueDate: 'Sunday',
      gracePeriodDays: 2,
      penaltyApplyDay: 'Wednesday',
      penaltyAmount: 150,
    },
    status: 'active',
    outstandingPrincipal: 9000,
    outstandingWeeklyDues: 7000,
    outstandingInterest: 0,
    outstandingPenalties: 0,
    totalPaidPrincipal: 3000,
    totalPaidDues: 3000,
    totalPaidInterest: 0,
    totalPaidPenalties: 0,
    createdAt: '2026-09-13T10:30:00.000Z',
    updatedAt: '2026-10-21T09:00:00.000Z',
  },
  {
    id: 'loan-003',
    loanId: 'LN-2026-003',
    customerId: 'cust-1003',
    loanType: 'sp_interest_only',
    originalPrincipal: 20000,
    actualDisbursement: 20000,
    weeklyDueAmount: 0,
    loanStartDate: '2026-09-20',
    tenureWeeks: 12,
    interestMethod: 'monthly_fixed',
    interestRateMonthly: 2.0, // 2% per month
    principalRepaymentTerms: 'Interest payable monthly, principal flexible',
    penaltyRules: {
      weeklyDueDate: 'Sunday',
      gracePeriodDays: 2,
      penaltyApplyDay: 'Wednesday',
      penaltyAmount: 150,
    },
    status: 'active',
    outstandingPrincipal: 20000,
    outstandingWeeklyDues: 0,
    outstandingInterest: 0,
    outstandingPenalties: 0,
    totalPaidPrincipal: 0,
    totalPaidDues: 0,
    totalPaidInterest: 800,
    totalPaidPenalties: 0,
    createdAt: '2026-09-20T11:30:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
  {
    id: 'loan-004',
    loanId: 'LN-2026-004',
    customerId: 'cust-1004',
    loanType: 'standard_weekly',
    originalPrincipal: 4000,
    actualDisbursement: 4000,
    weeklyDueAmount: 400,
    loanStartDate: '2026-08-02',
    tenureWeeks: 10,
    interestMethod: 'flat',
    interestRateMonthly: 0,
    penaltyRules: {
      weeklyDueDate: 'Sunday',
      gracePeriodDays: 2,
      penaltyApplyDay: 'Wednesday',
      penaltyAmount: 150,
    },
    status: 'completed',
    outstandingPrincipal: 0,
    outstandingWeeklyDues: 0,
    outstandingInterest: 0,
    outstandingPenalties: 0,
    totalPaidPrincipal: 4000,
    totalPaidDues: 4000,
    totalPaidInterest: 0,
    totalPaidPenalties: 0,
    createdAt: '2026-08-02T10:00:00.000Z',
    updatedAt: '2026-10-11T10:00:00.000Z',
  },
];

// Generate initial installment schedules
const INITIAL_INSTALLMENTS: Installment[] = [
  ...generateWeeklySchedule('loan-001', '2026-09-06', 10, 500).map((inst, index) => {
    if (index < 5) {
      return {
        ...inst,
        amountPaid: 500,
        isPaid: true,
        paidDate: '2026-10-04T11:20:00.000Z',
      };
    }
    if (index === 5) {
      // Week 6 missed & past Wednesday penalty day
      return {
        ...inst,
        isOverdue: true,
        penaltyAssessed: 150,
        penaltyDate: '2026-10-21',
      };
    }
    return inst;
  }),
  ...generateWeeklySchedule('loan-002', '2026-09-13', 10, 1000).map((inst, index) => {
    if (index < 3) {
      return {
        ...inst,
        amountPaid: 1000,
        isPaid: true,
        paidDate: '2026-10-04T14:45:00.000Z',
      };
    }
    return inst;
  }),
  ...generateWeeklySchedule('loan-004', '2026-08-02', 10, 400).map((inst) => ({
    ...inst,
    amountPaid: 400,
    isPaid: true,
    paidDate: '2026-10-11T10:00:00.000Z',
  })),
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    receiptNo: 'RCP-2026-00101',
    customerId: 'cust-1001',
    loanId: 'loan-001',
    amount: 2500,
    paymentDate: '2026-10-04T11:20:00.000Z',
    paymentMethod: 'Cash',
    referenceNo: 'CASH-REC-101',
    notes: 'Collected Week 1–5 in single visit',
    idempotencyKey: 'idemp-pay-101',
    allocations: {
      weeklyDue: 2500,
      interest: 0,
      penalty: 0,
      principalRepayment: 2500,
      coveredWeeks: [1, 2, 3, 4, 5],
    },
    isRefunded: false,
    refundedAmount: 0,
    createdAt: '2026-10-04T11:20:00.000Z',
  },
  {
    id: 'pay-002',
    receiptNo: 'RCP-2026-00102',
    customerId: 'cust-1002',
    loanId: 'loan-002',
    amount: 3000,
    paymentDate: '2026-10-04T14:45:00.000Z',
    paymentMethod: 'UPI',
    referenceNo: 'UPI984210002',
    notes: 'Week 1–3 payment',
    idempotencyKey: 'idemp-pay-102',
    allocations: {
      weeklyDue: 3000,
      interest: 0,
      penalty: 0,
      principalRepayment: 3000,
      coveredWeeks: [1, 2, 3],
    },
    isRefunded: false,
    refundedAmount: 0,
    createdAt: '2026-10-04T14:45:00.000Z',
  },
];

const INITIAL_TOKENS: CustomerAccessToken[] = [
  {
    id: 'tok-001',
    customerId: 'cust-1001',
    loanId: 'loan-001',
    token: 'sri-passbook-7a9f-4b12-9c34-selva',
    isRevoked: false,
    createdAt: '2026-09-06T10:00:00.000Z',
  },
  {
    id: 'tok-002',
    customerId: 'cust-1002',
    loanId: 'loan-002',
    token: 'sri-passbook-8e1d-4c89-9a11-kausalya',
    isRevoked: false,
    createdAt: '2026-09-13T11:00:00.000Z',
  },
  {
    id: 'tok-003',
    customerId: 'cust-1003',
    loanId: 'loan-003',
    token: 'sri-passbook-5d2c-49a3-88bb-anandhan',
    isRevoked: false,
    createdAt: '2026-09-20T12:00:00.000Z',
  },
];

const INITIAL_LEDGER: LedgerTransaction[] = [
  {
    id: 'ledg-001',
    loanId: 'loan-001',
    customerId: 'cust-1001',
    date: '2026-09-06T09:30:00.000Z',
    description: 'Loan Disbursement (Weekly Loan)',
    type: 'debit',
    category: 'disbursement',
    amount: 10000,
    referenceNo: 'LN-2026-001',
    balanceAfter: 10000,
  },
  {
    id: 'ledg-002',
    loanId: 'loan-001',
    customerId: 'cust-1001',
    date: '2026-10-11T10:00:00.000Z',
    description: 'Weekly Installments Collection (Week 1–6)',
    type: 'credit',
    category: 'payment',
    amount: 6000,
    referenceNo: 'RCP-2026-001',
    balanceAfter: 4000,
  },
  {
    id: 'ledg-003',
    loanId: 'loan-002',
    customerId: 'cust-1002',
    date: '2026-09-13T10:30:00.000Z',
    description: 'Loan Disbursement (Weekly Loan)',
    type: 'debit',
    category: 'disbursement',
    amount: 5000,
    referenceNo: 'LN-2026-002',
    balanceAfter: 5000,
  },
  {
    id: 'ledg-004',
    loanId: 'loan-002',
    customerId: 'cust-1002',
    date: '2026-10-11T11:00:00.000Z',
    description: 'Weekly Installments Collection (Week 1–5)',
    type: 'credit',
    category: 'payment',
    amount: 2500,
    referenceNo: 'RCP-2026-002',
    balanceAfter: 2500,
  },
  {
    id: 'ledg-005',
    loanId: 'loan-002',
    customerId: 'cust-1002',
    date: '2026-10-21T00:00:00.000Z',
    description: 'Overdue Wednesday Penalty (Week 6)',
    type: 'debit',
    category: 'penalty',
    amount: 150,
    referenceNo: 'PEN-LN-2026-002-W6',
    balanceAfter: 2650,
  },
];

class FinanceStore {
  private state: FinanceState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadInitialState();
    // Run initial penalty evaluation on start
    this.checkAndAssessDuePenalties();
  }

  private loadInitialState(): FinanceState {
    const savedSession = typeof window !== 'undefined' ? sessionStorage.getItem('sri_sennamal_auth_session') : null;
    const initialEmail = savedSession || null;

    try {
      const isExplicitlyCleared = localStorage.getItem(STORAGE_CLEARED_FLAG) === 'true';
      const saved = localStorage.getItem(STORAGE_KEY);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          customers: parsed.customers || [],
          loans: parsed.loans || [],
          installments: parsed.installments || [],
          payments: parsed.payments || [],
          refunds: parsed.refunds || [],
          ledger: parsed.ledger || [],
          tokens: parsed.tokens || [],
          autoSaveStatus: 'saved',
          currentUserEmail: initialEmail,
        };
      }

      if (isExplicitlyCleared) {
        return {
          businessInfo: DEFAULT_BUSINESS_INFO,
          customers: [],
          loans: [],
          installments: [],
          payments: [],
          refunds: [],
          ledger: [],
          tokens: [],
          auditLogs: [
            {
              id: 'audit-000',
              action: 'Slate Cleared',
              timestamp: new Date().toISOString(),
              details: 'Fresh clean slate ready for production data.',
              userEmail: initialEmail || DESIGNATED_OWNER_EMAIL,
            },
          ],
          recoveryPoints: [],
          autoSaveStatus: 'saved',
          lastSavedAt: new Date().toISOString(),
          currentUserEmail: initialEmail,
        };
      }
    } catch (e) {
      console.warn('Failed to load stored finance state', e);
    }

    return {
      businessInfo: DEFAULT_BUSINESS_INFO,
      customers: [],
      loans: [],
      installments: [],
      payments: [],
      refunds: [],
      ledger: [],
      tokens: [],
      auditLogs: [
        {
          id: 'audit-001',
          action: 'System Initialized',
          timestamp: new Date().toISOString(),
          details: 'Sri Sennamal Finance production ledger initialized.',
          userEmail: initialEmail || DESIGNATED_OWNER_EMAIL,
        },
      ],
      recoveryPoints: [],
      autoSaveStatus: 'saved',
      lastSavedAt: new Date().toISOString(),
      currentUserEmail: initialEmail,
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): FinanceState {
    return this.state;
  }

  /**
   * Persist state to local storage with auto-save status indicators
   */
  public async autoSave(): Promise<boolean> {
    this.state.autoSaveStatus = 'saving';
    this.notify();

    try {
      // Simulate real cloud database latency for realistic feedback
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const payload = {
        businessInfo: this.state.businessInfo,
        customers: this.state.customers,
        loans: this.state.loans,
        installments: this.state.installments,
        payments: this.state.payments,
        refunds: this.state.refunds,
        ledger: this.state.ledger,
        tokens: this.state.tokens,
        auditLogs: this.state.auditLogs,
        recoveryPoints: this.state.recoveryPoints,
        lastSavedAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      this.state.autoSaveStatus = 'saved';
      this.state.lastSavedAt = new Date().toISOString();
      this.notify();

      // Non-blocking background health check to maintain warm Supabase connection
      runHealthCheck().catch(() => {});

      return true;
    } catch (err) {
      console.error('AutoSave failed:', err);
      this.state.autoSaveStatus = 'error';
      this.notify();
      return false;
    }
  }

  /**
   * Evaluates all active loans and assesses ₹150 penalty for unpaid installments
   * that have passed Wednesday cutoff.
   */
  public checkAndAssessDuePenalties(mockCurrentDate?: Date): number {
    const checkDate = mockCurrentDate || new Date();
    let assessedCount = 0;

    const updatedInstallments = this.state.installments.map((inst) => {
      const evaluation = evaluateInstallmentPenalty(inst, checkDate);
      if (evaluation.shouldApply) {
        assessedCount++;
        const targetLoan = this.state.loans.find((l) => l.id === inst.loanId);
        
        // Record in ledger
        if (targetLoan) {
          const newPenaltyBalance = targetLoan.outstandingPenalties + evaluation.penaltyAmount;
          targetLoan.outstandingPenalties = newPenaltyBalance;

          this.state.ledger.push({
            id: `ledg-pen-${inst.id}-${Date.now()}`,
            loanId: inst.loanId,
            customerId: targetLoan.customerId,
            date: checkDate.toISOString(),
            description: `Overdue Wednesday Late Penalty (Week ${inst.weekNumber})`,
            type: 'debit',
            category: 'penalty',
            amount: evaluation.penaltyAmount,
            referenceNo: `PEN-${targetLoan.loanId}-W${inst.weekNumber}`,
            balanceAfter: targetLoan.outstandingPrincipal + targetLoan.outstandingWeeklyDues + newPenaltyBalance,
          });
        }

        return {
          ...inst,
          penaltyAssessed: evaluation.penaltyAmount,
          penaltyDate: checkDate.toISOString().split('T')[0],
          isOverdue: true,
        };
      }
      return inst;
    });

    if (assessedCount > 0) {
      this.state.installments = updatedInstallments;
      this.addAuditLog(
        'Penalty Assessment',
        `Assessed ₹150 Wednesday penalty on ${assessedCount} overdue installment(s).`
      );
      this.autoSave();
    }

    return assessedCount;
  }

  // ==========================================
  // CUSTOMER OPERATIONS
  // ==========================================

  public addCustomer(data: Omit<Customer, 'id' | 'uniqueId' | 'createdAt' | 'updatedAt'>): Customer {
    const nextNum = this.state.customers.length + 1001;
    const uniqueId = `CUST-${nextNum}`;
    const newCustomer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      uniqueId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.customers.push(newCustomer);
    this.addAuditLog('Add Customer', `Added customer ${newCustomer.fullName} (${newCustomer.uniqueId})`);
    this.autoSave();
    return newCustomer;
  }

  public updateCustomer(id: string, updates: Partial<Customer>): boolean {
    const index = this.state.customers.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.state.customers[index] = {
      ...this.state.customers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.addAuditLog('Update Customer', `Updated customer details for ${this.state.customers[index].fullName}`);
    this.autoSave();
    return true;
  }

  public toggleCustomerStatus(id: string): boolean {
    const cust = this.state.customers.find((c) => c.id === id);
    if (!cust) return false;

    cust.status = cust.status === 'active' ? 'inactive' : 'active';
    cust.updatedAt = new Date().toISOString();
    this.addAuditLog('Customer Status Change', `Marked ${cust.fullName} as ${cust.status}`);
    this.autoSave();
    return true;
  }

  // ==========================================
  // LOAN OPERATIONS
  // ==========================================

  public createLoan(params: {
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
  }): Loan {
    const customer = this.state.customers.find((c) => c.id === params.customerId);
    if (!customer) throw new Error('Customer not found');

    const nextIdNum = this.state.loans.length + 1;
    const loanId = `LN-2026-${String(nextIdNum).padStart(3, '0')}`;
    const loanUUID = `loan-${Date.now()}`;

    let totalDues = 0;
    if (params.loanType === 'standard_weekly') {
      totalDues = (params.weeklyDueAmount || 0) * (params.tenureWeeks || 10);
    } else if (params.loanType === 'daily_due') {
      totalDues = (params.dailyDueAmount || 0) * (params.tenureDays || 100);
    }

    const newLoan: Loan = {
      id: loanUUID,
      loanId,
      customerId: params.customerId,
      loanType: params.loanType,
      originalPrincipal: params.originalPrincipal,
      actualDisbursement: params.actualDisbursement,
      weeklyDueAmount: params.weeklyDueAmount || 0,
      dailyDueAmount: params.dailyDueAmount || 0,
      loanStartDate: params.loanStartDate,
      tenureWeeks: params.tenureWeeks || 10,
      tenureDays: params.tenureDays || 100,
      spFrequency: params.spFrequency || 'monthly',
      interestMethod: params.interestMethod || 'flat',
      interestRateMonthly: params.interestRateMonthly || 0,
      interestRateWeekly: params.interestRateWeekly || 0,
      principalRepaymentTerms: params.principalRepaymentTerms || '',
      penaltyRules: {
        hasPenalty: params.loanType === 'standard_weekly',
        weeklyDueDate: 'Sunday',
        gracePeriodDays: 2,
        penaltyApplyDay: 'Wednesday',
        penaltyAmount: params.loanType === 'standard_weekly' ? 150 : 0, // Daily due has NO penalty
      },
      status: 'active',
      outstandingPrincipal: params.originalPrincipal,
      outstandingWeeklyDues: totalDues,
      outstandingInterest: 0,
      outstandingPenalties: 0,
      totalPaidPrincipal: 0,
      totalPaidDues: 0,
      totalPaidInterest: 0,
      totalPaidPenalties: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.loans.push(newLoan);

    // Generate schedule
    if (params.loanType === 'standard_weekly') {
      const schedule = generateWeeklySchedule(
        loanUUID,
        params.loanStartDate,
        params.tenureWeeks || 10,
        params.weeklyDueAmount || 500
      );
      this.state.installments.push(...schedule);
    } else if (params.loanType === 'daily_due') {
      // Daily schedule with NO penalty
      const schedule = generateDailySchedule(
        loanUUID,
        params.loanStartDate,
        params.tenureDays || 100,
        params.dailyDueAmount || 50
      );
      this.state.installments.push(...schedule);
    }

    // Ledger Disbursement Entry
    const typeLabel =
      params.loanType === 'daily_due'
        ? 'Daily Due (No Penalty)'
        : params.loanType === 'sp_interest_only'
        ? `SP Loan (${params.spFrequency || 'monthly'})`
        : 'Weekly Loan';

    this.state.ledger.push({
      id: `ledg-disb-${Date.now()}`,
      loanId: loanUUID,
      customerId: params.customerId,
      date: new Date(params.loanStartDate).toISOString(),
      description: `Loan Disbursement (${typeLabel})`,
      type: 'debit',
      category: 'disbursement',
      amount: params.originalPrincipal,
      referenceNo: loanId,
      balanceAfter: params.originalPrincipal,
    });

    // Create unique Passbook Token for this loan
    this.generatePassbookToken(params.customerId, loanUUID);

    this.addAuditLog('Create Loan', `Issued ${loanId} of ₹${params.originalPrincipal} (${typeLabel}) to ${customer.fullName}`);
    this.autoSave();
    return newLoan;
  }

  /**
   * Clear All Data (Full Factory Reset)
   * Purges all customers, loans, installments, payments, refunds, ledger, tokens, recovery points,
   * clears localStorage, and saves empty state across JSON and persistence.
   */
  public async clearAllData(): Promise<boolean> {
    this.state.customers = [];
    this.state.loans = [];
    this.state.installments = [];
    this.state.payments = [];
    this.state.refunds = [];
    this.state.ledger = [];
    this.state.tokens = [];
    this.state.recoveryPoints = [];
    this.state.auditLogs = [
      {
        id: `audit-clear-${Date.now()}`,
        action: 'Clear Data Executed',
        timestamp: new Date().toISOString(),
        details: 'All records, customers, loans, payments, and JSON data cleared to fresh slate.',
        userEmail: this.state.currentUserEmail || DESIGNATED_OWNER_EMAIL,
      },
    ];

    try {
      localStorage.setItem(STORAGE_CLEARED_FLAG, 'true');
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not set cleared flag in local storage', e);
    }

    await this.autoSave();
    this.notify();
    return true;
  }

  /**
   * Repopulate initial demo dataset for review or testing
   */
  public async seedDemoData(): Promise<boolean> {
    try {
      localStorage.removeItem(STORAGE_CLEARED_FLAG);
    } catch (e) {
      console.warn('Could not remove cleared flag', e);
    }

    this.state.customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    this.state.loans = JSON.parse(JSON.stringify(INITIAL_LOANS));
    this.state.installments = JSON.parse(JSON.stringify(INITIAL_INSTALLMENTS));
    this.state.payments = JSON.parse(JSON.stringify(INITIAL_PAYMENTS));
    this.state.refunds = [];
    this.state.ledger = JSON.parse(JSON.stringify(INITIAL_LEDGER));
    this.state.tokens = JSON.parse(JSON.stringify(INITIAL_TOKENS));
    this.state.recoveryPoints = [];
    this.state.auditLogs.unshift({
      id: `audit-seed-${Date.now()}`,
      action: 'Demo Data Seeded',
      timestamp: new Date().toISOString(),
      details: 'Demonstration records repopulated for review.',
      userEmail: this.state.currentUserEmail || DESIGNATED_OWNER_EMAIL,
    });

    await this.autoSave();
    this.notify();
    return true;
  }

  // ==========================================
  // PAYMENT COLLECTION & MULTIPLE DUE ENTRY
  // ==========================================

  public collectWeeklyDues(params: {
    loanId: string;
    amountReceived: number;
    paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
    referenceNo?: string;
    notes?: string;
    selectedInstallmentIds?: string[];
    excessAllocation?: 'next_due' | 'principal' | 'advance';
  }): { payment: Payment; coveredWeeksText: string } {
    const loan = this.state.loans.find((l) => l.id === params.loanId);
    if (!loan) throw new Error('Loan not found');

    const customer = this.state.customers.find((c) => c.id === loan.customerId);
    const loanInstallments = this.state.installments.filter((i) => i.loanId === loan.id);

    // Run allocation engine
    const result = calculateMultipleDueAllocation(
      loanInstallments,
      params.amountReceived,
      params.selectedInstallmentIds
    );

    // Apply allocations to installments
    result.allocations.forEach((alloc) => {
      const inst = this.state.installments.find((i) => i.id === alloc.installmentId);
      if (inst) {
        inst.amountPaid += alloc.duePaid;
        inst.penaltyPaid += alloc.penaltyPaid;
        if (inst.amountPaid >= inst.amountDue && inst.penaltyPaid >= inst.penaltyAssessed) {
          inst.isPaid = true;
          inst.isOverdue = false;
          inst.paidDate = new Date().toISOString();
        }
      }
    });

    // Update Loan Balances (strictly separate)
    loan.outstandingWeeklyDues = Math.max(0, loan.outstandingWeeklyDues - result.totalDuePaid);
    loan.outstandingPenalties = Math.max(0, loan.outstandingPenalties - result.totalPenaltyPaid);
    loan.totalPaidDues += result.totalDuePaid;
    loan.totalPaidPenalties += result.totalPenaltyPaid;

    // Principal reduction in standard weekly is proportional to dues paid
    const principalPaidPortion = Math.min(loan.outstandingPrincipal, result.totalDuePaid);
    loan.outstandingPrincipal = Math.max(0, loan.outstandingPrincipal - principalPaidPortion);
    loan.totalPaidPrincipal += principalPaidPortion;

    // Check if loan is completed
    if (loan.outstandingWeeklyDues <= 0 && loan.outstandingPenalties <= 0) {
      loan.status = 'completed';
    }

    const receiptNo = `RCP-2026-${String(this.state.payments.length + 1).padStart(3, '0')}`;
    const coveredWeeksText = formatCoveredWeeksSummary(result.coveredWeeks);

    const payment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNo,
      customerId: loan.customerId,
      loanId: loan.id,
      amount: params.amountReceived,
      paymentDate: new Date().toISOString(),
      paymentMethod: params.paymentMethod,
      referenceNo: params.referenceNo || `REF-${Date.now()}`,
      notes: params.notes || `Collected ${coveredWeeksText}`,
      idempotencyKey: `idemp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      allocations: {
        weeklyDue: result.totalDuePaid,
        interest: 0,
        penalty: result.totalPenaltyPaid,
        principalRepayment: principalPaidPortion,
        coveredWeeks: result.coveredWeeks,
      },
      isRefunded: false,
      refundedAmount: 0,
      createdAt: new Date().toISOString(),
    };

    this.state.payments.push(payment);

    // Ledger Entry
    this.state.ledger.push({
      id: `ledg-pay-${Date.now()}`,
      loanId: loan.id,
      customerId: loan.customerId,
      date: new Date().toISOString(),
      description: `Payment Received (${coveredWeeksText})`,
      type: 'credit',
      category: 'payment',
      amount: params.amountReceived,
      referenceNo: receiptNo,
      balanceAfter: loan.outstandingPrincipal + loan.outstandingWeeklyDues + loan.outstandingPenalties,
    });

    this.addAuditLog(
      'Payment Collected',
      `Receipt ${receiptNo} for ${customer?.fullName || 'Customer'}: ₹${params.amountReceived} (${coveredWeeksText})`
    );
    this.autoSave();

    return { payment, coveredWeeksText };
  }

  /**
   * SP Loan Payment:
   * - Interest payment: DOES NOT reduce principal!
   * - Principal repayment: Reduces principal. Once principal reaches 0, future interest ceases!
   */
  public collectSPLoanPayment(params: {
    loanId: string;
    interestAmount: number;
    principalRepayment: number;
    paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
    referenceNo?: string;
    notes?: string;
  }): Payment {
    const loan = this.state.loans.find((l) => l.id === params.loanId);
    if (!loan) throw new Error('Loan not found');

    const totalAmount = params.interestAmount + params.principalRepayment;
    if (totalAmount <= 0) throw new Error('Payment amount must be greater than zero');

    // 1. Process Interest
    if (params.interestAmount > 0) {
      loan.outstandingInterest = Math.max(0, loan.outstandingInterest - params.interestAmount);
      loan.totalPaidInterest += params.interestAmount;
    }

    // 2. Process Principal Repayment (recorded separately, stops future interest once 0)
    if (params.principalRepayment > 0) {
      loan.outstandingPrincipal = Math.max(0, loan.outstandingPrincipal - params.principalRepayment);
      loan.totalPaidPrincipal += params.principalRepayment;

      if (loan.outstandingPrincipal <= 0) {
        loan.status = 'completed';
        loan.outstandingInterest = 0; // ceases future interest accrual
      }
    }

    const receiptNo = `RCP-2026-${String(this.state.payments.length + 1).padStart(3, '0')}`;
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNo,
      customerId: loan.customerId,
      loanId: loan.id,
      amount: totalAmount,
      paymentDate: new Date().toISOString(),
      paymentMethod: params.paymentMethod,
      referenceNo: params.referenceNo || `REF-${Date.now()}`,
      notes: params.notes || `SP Loan Payment (Interest: ₹${params.interestAmount}, Principal: ₹${params.principalRepayment})`,
      idempotencyKey: `idemp-sp-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      allocations: {
        weeklyDue: 0,
        interest: params.interestAmount,
        penalty: 0,
        principalRepayment: params.principalRepayment,
        coveredWeeks: [],
      },
      isRefunded: false,
      refundedAmount: 0,
      createdAt: new Date().toISOString(),
    };

    this.state.payments.push(payment);

    // Ledger Entry
    this.state.ledger.push({
      id: `ledg-sp-${Date.now()}`,
      loanId: loan.id,
      customerId: loan.customerId,
      date: new Date().toISOString(),
      description: `SP Payment (Interest: ₹${params.interestAmount}, Principal Repayment: ₹${params.principalRepayment})`,
      type: 'credit',
      category: params.principalRepayment > 0 ? 'principal_repayment' : 'interest',
      amount: totalAmount,
      referenceNo: receiptNo,
      balanceAfter: loan.outstandingPrincipal + loan.outstandingInterest,
    });

    this.addAuditLog(
      'SP Payment Collected',
      `Receipt ${receiptNo} for Loan ${loan.loanId}: ₹${totalAmount}`
    );
    this.autoSave();
    return payment;
  }

  // ==========================================
  // REFUND MANAGEMENT
  // ==========================================

  public issueRefund(params: {
    originalPaymentId: string;
    amount: number;
    reason: string;
    paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
    referenceNo?: string;
  }): Refund {
    const payment = this.state.payments.find((p) => p.id === params.originalPaymentId);
    if (!payment) throw new Error('Original payment not found');

    const remainingRefundable = payment.amount - payment.refundedAmount;
    if (params.amount <= 0 || params.amount > remainingRefundable) {
      throw new Error(`Refund amount cannot exceed remaining refundable balance of ₹${remainingRefundable}`);
    }

    const loan = this.state.loans.find((l) => l.id === payment.loanId);
    if (!loan) throw new Error('Loan not found');

    const refundId = `ref-${Date.now()}`;
    const refund: Refund = {
      id: refundId,
      originalPaymentId: payment.id,
      receiptNo: payment.receiptNo,
      loanId: loan.id,
      customerId: loan.customerId,
      amount: params.amount,
      reason: params.reason,
      referenceNo: params.referenceNo || `REFUND-REF-${Date.now()}`,
      paymentMethod: params.paymentMethod,
      refundDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Update payment record
    payment.refundedAmount += params.amount;
    payment.isRefunded = payment.refundedAmount >= payment.amount;

    // Adjust Loan balances back accurately
    if (loan.loanType === 'standard_weekly') {
      loan.outstandingWeeklyDues += params.amount;
      loan.totalPaidDues = Math.max(0, loan.totalPaidDues - params.amount);
      loan.outstandingPrincipal += params.amount;
      loan.totalPaidPrincipal = Math.max(0, loan.totalPaidPrincipal - params.amount);
      if (loan.status === 'completed') {
        loan.status = 'active';
      }
    } else {
      loan.outstandingPrincipal += params.amount;
      loan.totalPaidPrincipal = Math.max(0, loan.totalPaidPrincipal - params.amount);
    }

    this.state.refunds.push(refund);

    // Ledger Entry for Refund (Debit back to borrower account balance)
    this.state.ledger.push({
      id: `ledg-ref-${Date.now()}`,
      loanId: loan.id,
      customerId: loan.customerId,
      date: new Date().toISOString(),
      description: `Refund Issued for ${payment.receiptNo} (${params.reason})`,
      type: 'debit',
      category: 'refund',
      amount: params.amount,
      referenceNo: refund.referenceNo,
      balanceAfter: loan.outstandingPrincipal + loan.outstandingWeeklyDues + loan.outstandingPenalties,
    });

    this.addAuditLog(
      'Refund Issued',
      `Refunded ₹${params.amount} on Receipt ${payment.receiptNo} (${params.reason})`
    );
    this.autoSave();
    return refund;
  }

  // ==========================================
  // CUSTOMER PASSBOOK TOKEN MANAGEMENT
  // ==========================================

  public generatePassbookToken(customerId: string, loanId: string): CustomerAccessToken {
    // Revoke any existing active tokens for this loan
    this.state.tokens.forEach((t) => {
      if (t.loanId === loanId && !t.isRevoked) {
        t.isRevoked = true;
        t.revokedAt = new Date().toISOString();
      }
    });

    const randomEntropy = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const token = `sri-passbook-${Date.now().toString(36)}-${randomEntropy}`;

    const newToken: CustomerAccessToken = {
      id: `tok-${Date.now()}`,
      customerId,
      loanId,
      token,
      isRevoked: false,
      createdAt: new Date().toISOString(),
    };

    this.state.tokens.push(newToken);
    this.autoSave();
    return newToken;
  }

  public revokePassbookToken(tokenId: string): boolean {
    const token = this.state.tokens.find((t) => t.id === tokenId);
    if (!token) return false;

    token.isRevoked = true;
    token.revokedAt = new Date().toISOString();
    this.addAuditLog('Revoke Passbook Token', `Revoked token ${token.token.substring(0, 16)}...`);
    this.autoSave();
    return true;
  }

  public getPassbookDataByToken(tokenStr: string): PassbookData | null {
    const match = this.state.tokens.find((t) => t.token === tokenStr && !t.isRevoked);
    if (!match) return null;

    const loan = this.state.loans.find((l) => l.id === match.loanId);
    if (!loan) return null;

    const customer = this.state.customers.find((c) => c.id === loan.customerId);
    if (!customer) return null;

    const installments = this.state.installments
      .filter((i) => i.loanId === loan.id)
      .sort((a, b) => a.weekNumber - b.weekNumber);

    const payments = this.state.payments
      .filter((p) => p.loanId === loan.id)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    const outstandingBalance = loan.outstandingPrincipal + loan.outstandingWeeklyDues + loan.outstandingPenalties + loan.outstandingInterest;

    return {
      customerName: customer.fullName,
      loan,
      installments,
      payments,
      outstandingBalance,
      businessInfo: this.state.businessInfo,
    };
  }

  // ==========================================
  // AUTO SAVE & RESTORE (EXACTLY TWO OPTIONS)
  // ==========================================

  /**
   * Option 1: Trigger Manual Auto Save Sync
   */
  public async triggerAutoSave(): Promise<boolean> {
    return this.autoSave();
  }

  /**
   * Option 2: Restore from a Verified Recovery Point
   */
  public createRecoveryPoint(note: string): RecoveryPoint {
    const point: RecoveryPoint = {
      id: `rec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note,
      recordCounts: {
        customers: this.state.customers.length,
        loans: this.state.loans.length,
        payments: this.state.payments.length,
        installments: this.state.installments.length,
      },
      snapshot: {
        customers: JSON.parse(JSON.stringify(this.state.customers)),
        loans: JSON.parse(JSON.stringify(this.state.loans)),
        installments: JSON.parse(JSON.stringify(this.state.installments)),
        payments: JSON.parse(JSON.stringify(this.state.payments)),
        refunds: JSON.parse(JSON.stringify(this.state.refunds)),
        ledger: JSON.parse(JSON.stringify(this.state.ledger)),
        tokens: JSON.parse(JSON.stringify(this.state.tokens)),
        businessInfo: JSON.parse(JSON.stringify(this.state.businessInfo)),
      },
    };

    this.state.recoveryPoints.unshift(point);
    // Keep max 10 recovery snapshots
    if (this.state.recoveryPoints.length > 10) {
      this.state.recoveryPoints.pop();
    }

    try {
      localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(this.state.recoveryPoints));
    } catch (e) {
      console.warn('Could not cache recovery points', e);
    }

    return point;
  }

  public restoreRecoveryPoint(recoveryPointId: string): boolean {
    const target = this.state.recoveryPoints.find((p) => p.id === recoveryPointId);
    if (!target) return false;

    // Safety: Create pre-restore checkpoint before overwriting
    this.createRecoveryPoint(`Safety checkpoint before restoring "${target.note}"`);

    // Restore snapshot safely without deleting financial history or creating duplicate ids
    this.state.customers = JSON.parse(JSON.stringify(target.snapshot.customers));
    this.state.loans = JSON.parse(JSON.stringify(target.snapshot.loans));
    this.state.installments = JSON.parse(JSON.stringify(target.snapshot.installments));
    this.state.payments = JSON.parse(JSON.stringify(target.snapshot.payments));
    this.state.refunds = JSON.parse(JSON.stringify(target.snapshot.refunds));
    this.state.ledger = JSON.parse(JSON.stringify(target.snapshot.ledger));
    this.state.tokens = JSON.parse(JSON.stringify(target.snapshot.tokens));
    this.state.businessInfo = JSON.parse(JSON.stringify(target.snapshot.businessInfo));

    this.addAuditLog(
      'Restore Executed',
      `Restored state from verified recovery point created at ${new Date(target.timestamp).toLocaleString('en-IN')}`
    );
    this.autoSave();
    return true;
  }

  // ==========================================
  // SETTINGS & AUDIT
  // ==========================================

  public updateBusinessInfo(info: Partial<BusinessInfo>) {
    this.state.businessInfo = { ...this.state.businessInfo, ...info };
    this.addAuditLog('Update Business Info', 'Updated business profile settings.');
    this.autoSave();
  }

  public addAuditLog(action: string, details: string) {
    this.state.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      action,
      timestamp: new Date().toISOString(),
      details,
      userEmail: this.state.currentUserEmail || DESIGNATED_OWNER_EMAIL,
    });
    if (this.state.auditLogs.length > 200) {
      this.state.auditLogs.pop();
    }
  }

  public setOwnerSession(email: string | null) {
    this.state.currentUserEmail = email;
    if (typeof window !== 'undefined') {
      if (email) {
        sessionStorage.setItem('sri_sennamal_auth_session', email);
      } else {
        sessionStorage.removeItem('sri_sennamal_auth_session');
      }
      localStorage.removeItem('sri_sennamal_auth_session');
    }
    this.notify();
  }
}

// Global Singleton Instance
export const financeStore = new FinanceStore();
