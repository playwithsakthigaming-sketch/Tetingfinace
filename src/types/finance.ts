/**
 * Sri Sennamal Finance — Types & Interfaces
 * Exact decimal financial accuracy, weekly loans, SP loans, penalties, and audit trails.
 */

export interface BusinessInfo {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  licenceNumber: string; // 'Licence No: Not provided' if unverified
  licenceVerified: boolean;
}

export type CustomerStatus = 'active' | 'inactive';

export interface Customer {
  id: string; // UUID
  uniqueId: string; // e.g. CUST-1001
  fullName: string;
  phone: string;
  address: string;
  loanStartDate: string; // YYYY-MM-DD
  notes: string;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export type LoanType = 'standard_weekly' | 'daily_due' | 'sp_interest_only';
export type LoanStatus = 'active' | 'completed' | 'overdue' | 'defaulted';

export interface PenaltyRules {
  hasPenalty?: boolean; // false for daily_due
  weeklyDueDate?: 'Sunday';
  gracePeriodDays?: 2; // Monday, Tuesday
  penaltyApplyDay?: 'Wednesday';
  penaltyAmount: number; // 0 for daily_due, 150 for weekly
}

export interface Loan {
  id: string; // UUID
  loanId: string; // e.g. LN-2026-001
  customerId: string;
  loanType: LoanType;
  originalPrincipal: number;
  actualDisbursement: number;
  weeklyDueAmount: number;
  dailyDueAmount?: number;
  loanStartDate: string; // YYYY-MM-DD
  tenureWeeks: number; // e.g. 10, 12, 15, 20
  tenureDays?: number; // e.g. 100 days for daily due
  
  // SP Loan Specific (supports weekly & monthly)
  spFrequency?: 'weekly' | 'monthly';
  interestMethod: 'flat' | 'reducing' | 'monthly_fixed';
  interestRateMonthly: number; // e.g. 2.0%
  interestRateWeekly?: number; // e.g. 0.5% or fixed weekly interest
  principalRepaymentTerms?: string;

  penaltyRules: PenaltyRules;
  status: LoanStatus;

  // Running Balances (strictly separated per loan)
  outstandingPrincipal: number;
  outstandingWeeklyDues: number;
  outstandingInterest: number;
  outstandingPenalties: number;

  totalPaidPrincipal: number;
  totalPaidDues: number;
  totalPaidInterest: number;
  totalPaidPenalties: number;

  createdAt: string;
  updatedAt: string;
}

export interface Installment {
  id: string;
  loanId: string;
  weekNumber: number; // 1, 2, 3...
  dueDate: string; // Sunday YYYY-MM-DD
  amountDue: number; // ₹500
  amountPaid: number; // partial support
  isPaid: boolean;
  isOverdue: boolean;
  penaltyAssessed: number; // ₹150
  penaltyPaid: number;
  penaltyDate?: string;
  paidDate?: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';

export interface PaymentAllocation {
  weeklyDue: number;
  interest: number;
  penalty: number;
  principalRepayment: number;
  coveredWeeks: number[]; // e.g. [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
}

export interface Payment {
  id: string;
  receiptNo: string; // e.g. RCP-2026-001
  customerId: string;
  loanId: string;
  amount: number;
  paymentDate: string; // ISO string
  paymentMethod: PaymentMethod;
  referenceNo: string;
  notes?: string;
  idempotencyKey: string;
  allocations: PaymentAllocation;
  isRefunded: boolean;
  refundedAmount: number;
  createdAt: string;
}

export interface Refund {
  id: string;
  originalPaymentId: string;
  receiptNo: string;
  loanId: string;
  customerId: string;
  amount: number;
  reason: string;
  referenceNo: string;
  paymentMethod: PaymentMethod;
  refundDate: string;
  createdAt: string;
}

export type LedgerCategory =
  | 'disbursement'
  | 'weekly_due'
  | 'interest'
  | 'penalty'
  | 'payment'
  | 'refund'
  | 'principal_repayment'
  | 'adjustment';

export interface LedgerTransaction {
  id: string;
  loanId: string;
  customerId: string;
  date: string; // ISO string
  description: string;
  type: 'debit' | 'credit';
  category: LedgerCategory;
  amount: number;
  referenceNo: string;
  balanceAfter: number;
}

export interface CustomerAccessToken {
  id: string;
  customerId: string;
  loanId: string;
  token: string; // secure UUID or random hex
  isRevoked: boolean;
  createdAt: string;
  revokedAt?: string;
}

export interface RecoveryPoint {
  id: string;
  timestamp: string;
  note: string;
  recordCounts: {
    customers: number;
    loans: number;
    payments: number;
    installments: number;
  };
  snapshot: {
    customers: Customer[];
    loans: Loan[];
    installments: Installment[];
    payments: Payment[];
    refunds: Refund[];
    ledger: LedgerTransaction[];
    tokens: CustomerAccessToken[];
    businessInfo: BusinessInfo;
  };
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  userEmail: string;
}

export interface PassbookData {
  customerName: string;
  loan: Loan;
  installments: Installment[];
  payments: Payment[];
  outstandingBalance: number;
  businessInfo: BusinessInfo;
}
