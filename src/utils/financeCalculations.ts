/**
 * Sri Sennamal Finance — Financial Calculations & Business Rules Engine
 * Implements strict Indian weekly loan rules, SP loan interest, and Wednesday penalties.
 */

import { Installment, Loan, PaymentAllocation } from '../types/finance';

export const PENALTY_PERCENTAGE = 0.10; // 10% of weekly due (1000 = 100, 2000 = 200)
export const PENALTY_AMOUNT = 100; // Baseline penalty for ₹1000 due
export const TIMEZONE = 'Asia/Kolkata';

/**
 * Calculate late penalty for an overdue installment.
 * Rule: 10% of that specific week's due amount (e.g. ₹1,000 = ₹100, ₹2,000 = ₹200).
 * Assessed only once on that specific overdue week when passing Wednesday.
 */
export function calculateInstallmentPenaltyAmount(amountDue: number): number {
  const baseDue = amountDue > 0 ? amountDue : 1000;
  return Math.round(baseDue * 0.1);
}

/**
 * Format any number into Indian Currency format (e.g. ₹ 1,50,000.00 or ₹ 5,000)
 */
export function formatIndianCurrency(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Get the day of week name (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * in Asia/Kolkata timezone.
 */
export function getKolkataDayOfWeek(dateInput: Date | string): number {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  // Format to Asia/Kolkata string to determine day of week correctly
  const kolkataStr = d.toLocaleString('en-US', { timeZone: TIMEZONE });
  const kolkataDate = new Date(kolkataStr);
  return kolkataDate.getDay();
}

/**
 * Check if a date qualifies for Wednesday ₹150 penalty.
 * Rule:
 * - Sunday: Due date
 * - Monday: Grace period (no penalty)
 * - Tuesday: Grace period (no penalty)
 * - Wednesday onward (Wed, Thu, Fri, Sat or later): Penalty applies if unpaid!
 */
export function isWednesdayOrLater(currentDate: Date | string, installmentDueDate: string): boolean {
  const curr = typeof currentDate === 'string' ? new Date(currentDate) : currentDate;
  const due = new Date(installmentDueDate);

  // If current date is strictly before the due date, no penalty
  if (curr.getTime() < due.getTime()) {
    return false;
  }

  // Calculate day difference from due date (Sunday)
  // Due date is Sunday (day 0).
  // Monday is +1 day, Tuesday is +2 days.
  // Wednesday is +3 days.
  // If the difference in time is >= 3 days (or if it's a later week), Wednesday penalty applies.
  const diffTime = curr.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // If due date was Sunday:
  // Day 0 = Sunday
  // Day 1 = Monday (grace)
  // Day 2 = Tuesday (grace)
  // Day 3+ = Wednesday onward (penalty eligible)
  return diffDays >= 3;
}

/**
 * Evaluates whether an installment is eligible for a ₹150 penalty.
 * Rules:
 * 1. Must NOT be fully paid (amountPaid < amountDue).
 * 2. Penalty must NOT have already been assessed (penaltyAssessed === 0).
 * 3. Must be Wednesday or later relative to the Sunday due date.
 */
export function evaluateInstallmentPenalty(
  installment: Installment,
  currentDate: Date | string = new Date()
): { shouldApply: boolean; penaltyAmount: number } {
  // Daily Due has NO penalty ('athu penalty illa')
  if (installment.id.includes('-day-')) {
    return { shouldApply: false, penaltyAmount: 0 };
  }

  // Never penalize a fully paid installment
  if (installment.isPaid || installment.amountPaid >= installment.amountDue) {
    return { shouldApply: false, penaltyAmount: 0 };
  }

  // Never assess duplicate penalties — antha week mattum penalty add panna pothum
  if (installment.penaltyAssessed > 0) {
    return { shouldApply: false, penaltyAmount: 0 };
  }

  // Check Wednesday cutoff: Sunday due -> Mon/Tue grace -> Wed penalty applies
  if (isWednesdayOrLater(currentDate, installment.dueDate)) {
    const penaltyAmount = calculateInstallmentPenaltyAmount(installment.amountDue);
    return { shouldApply: true, penaltyAmount };
  }

  return { shouldApply: false, penaltyAmount: 0 };
}

/**
 * Calculate next Sunday from a given date.
 */
export function getNextSunday(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (7 - day) % 7;
  result.setDate(result.getDate() + (diff === 0 ? 7 : diff));
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Generate standard weekly installment schedule for a loan.
 * Dues always fall on Sundays.
 */
export function generateWeeklySchedule(
  loanId: string,
  startDateStr: string,
  tenureWeeks: number,
  weeklyDueAmount: number
): Installment[] {
  const installments: Installment[] = [];
  const start = new Date(startDateStr);
  let nextSunday = getNextSunday(start);

  for (let week = 1; week <= tenureWeeks; week++) {
    const dueDateStr = nextSunday.toISOString().split('T')[0];
    installments.push({
      id: `inst-${loanId}-${week}`,
      loanId,
      weekNumber: week,
      dueDate: dueDateStr,
      amountDue: weeklyDueAmount,
      amountPaid: 0,
      isPaid: false,
      isOverdue: false,
      penaltyAssessed: 0,
      penaltyPaid: 0,
    });

    // Advance 7 days to next Sunday
    const next = new Date(nextSunday);
    next.setDate(next.getDate() + 7);
    nextSunday = next;
  }

  return installments;
}

/**
 * Generate Daily Due installment schedule.
 * CRITICAL RULE: Daily due loans have NO PENALTY ('athu penalty illa').
 */
export function generateDailySchedule(
  loanId: string,
  startDateStr: string,
  tenureDays: number,
  dailyDueAmount: number
): Installment[] {
  const installments: Installment[] = [];
  const start = new Date(startDateStr);

  for (let day = 1; day <= tenureDays; day++) {
    const current = new Date(start);
    current.setDate(current.getDate() + (day - 1));
    const dueDateStr = current.toISOString().split('T')[0];
    installments.push({
      id: `inst-day-${loanId}-${day}`,
      loanId,
      weekNumber: day, // Represents Day number (Day 1, Day 2, etc.)
      dueDate: dueDateStr,
      amountDue: dailyDueAmount,
      amountPaid: 0,
      isPaid: false,
      isOverdue: false,
      penaltyAssessed: 0, // NO PENALTY EVER FOR DAILY DUE
      penaltyPaid: 0,
    });
  }

  return installments;
}

/**
 * Allocate multiple weekly installments in a single visit.
 * Example: Weekly installment = ₹500, Amount = ₹5000 -> 10 installments paid.
 * Handles partial payments, penalties, and excess amounts.
 */
export function calculateMultipleDueAllocation(
  installments: Installment[],
  amountReceived: number,
  selectedInstallmentIds?: string[]
): {
  allocations: {
    installmentId: string;
    weekNumber: number;
    duePaid: number;
    penaltyPaid: number;
    settled: boolean;
  }[];
  totalDuePaid: number;
  totalPenaltyPaid: number;
  remainingExcess: number;
  coveredWeeks: number[];
} {
  let balance = amountReceived;
  let totalDuePaid = 0;
  let totalPenaltyPaid = 0;
  const coveredWeeks: number[] = [];
  const allocations: {
    installmentId: string;
    weekNumber: number;
    duePaid: number;
    penaltyPaid: number;
    settled: boolean;
  }[] = [];

  // Filter or sort unpaid installments
  const eligible = installments
    .filter((inst) => !selectedInstallmentIds || selectedInstallmentIds.includes(inst.id))
    .filter((inst) => !inst.isPaid || inst.penaltyAssessed > inst.penaltyPaid)
    .sort((a, b) => a.weekNumber - b.weekNumber);

  for (const inst of eligible) {
    if (balance <= 0) break;

    // 1. First allocate to unpaid penalty if any exists on this installment
    const unpaidPenalty = Math.max(0, inst.penaltyAssessed - inst.penaltyPaid);
    let penaltyPayment = 0;
    if (unpaidPenalty > 0 && balance > 0) {
      penaltyPayment = Math.min(balance, unpaidPenalty);
      balance -= penaltyPayment;
      totalPenaltyPaid += penaltyPayment;
    }

    // 2. Next allocate to remaining weekly due
    const remainingDue = Math.max(0, inst.amountDue - inst.amountPaid);
    let duePayment = 0;
    if (remainingDue > 0 && balance > 0) {
      duePayment = Math.min(balance, remainingDue);
      balance -= duePayment;
      totalDuePaid += duePayment;
    }

    const isFullySettled =
      inst.amountPaid + duePayment >= inst.amountDue &&
      inst.penaltyPaid + penaltyPayment >= inst.penaltyAssessed;

    if (duePayment > 0 || penaltyPayment > 0) {
      coveredWeeks.push(inst.weekNumber);
      allocations.push({
        installmentId: inst.id,
        weekNumber: inst.weekNumber,
        duePaid: duePayment,
        penaltyPaid: penaltyPayment,
        settled: isFullySettled,
      });
    }
  }

  return {
    allocations,
    totalDuePaid,
    totalPenaltyPaid,
    remainingExcess: balance,
    coveredWeeks,
  };
}

/**
 * SP Loan Interest Calculation Engine:
 * - Interest payments DO NOT reduce principal.
 * - Principal repayments are recorded separately.
 * - Once principal is fully repaid, future interest stops accruing.
 * - Never charge interest on principal already repaid.
 */
export function calculateSPInterest(
  outstandingPrincipal: number,
  monthlyRatePercent: number,
  months: number = 1
): number {
  if (outstandingPrincipal <= 0) {
    return 0; // Stopped accrual: 0 interest once principal is 0
  }
  // Simple monthly interest: (Principal * Rate * Months) / 100
  const interest = (outstandingPrincipal * monthlyRatePercent * months) / 100;
  return Math.round(interest * 100) / 100;
}

/**
 * Generates human readable due summary (e.g. "Week 1", "Week 1–10", "Week 3, 5, 7")
 */
export function formatCoveredWeeksSummary(weeks: number[]): string {
  if (!weeks || weeks.length === 0) return 'Regular Due';
  if (weeks.length === 1) return `Week ${weeks[0]}`;

  const sorted = [...weeks].sort((a, b) => a - b);
  // Check if consecutive
  let isConsecutive = true;
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] !== sorted[i] + 1) {
      isConsecutive = false;
      break;
    }
  }

  if (isConsecutive) {
    return `Week ${sorted[0]}–${sorted[sorted.length - 1]}`;
  }

  return `Week ${sorted.join(', ')}`;
}
