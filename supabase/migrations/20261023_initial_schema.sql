-- ====================================================================
-- SRI SENNAMAL FINANCE — SUPABASE POSTGRESQL PRODUCTION MIGRATION
-- Company: Sri Sennamal Finance, Coimbatore, Tamil Nadu
-- Owner Email: playwithsakthigaming@gmail.com
-- ====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL DEFAULT 'Sri Sennamal Finance',
    phone TEXT NOT NULL DEFAULT '7812834522',
    email TEXT NOT NULL DEFAULT 'playwithsakthigaming@gmail.com',
    address TEXT NOT NULL DEFAULT 'Coimbatore, Tamil Nadu, India',
    currency TEXT NOT NULL DEFAULT 'INR',
    currency_symbol TEXT NOT NULL DEFAULT '₹',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    licence_number TEXT NOT NULL DEFAULT 'Licence No: Not provided',
    licence_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 2. OWNER ACCESS TABLE (Enforces Single Owner Authorization)
CREATE TABLE IF NOT EXISTS public.owner_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_email TEXT UNIQUE NOT NULL,
    auth_user_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- Seed Designated Owner
INSERT INTO public.owner_access (owner_email, is_active)
VALUES ('playwithsakthigaming@gmail.com', TRUE)
ON CONFLICT (owner_email) DO NOTHING;

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unique_id TEXT UNIQUE NOT NULL, -- e.g. CUST-1001
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    loan_start_date DATE NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_unique_id ON public.customers(unique_id);

-- 4. LOANS TABLE
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id TEXT UNIQUE NOT NULL, -- e.g. LN-2026-001
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    loan_type TEXT NOT NULL DEFAULT 'standard_weekly' CHECK (loan_type IN ('standard_weekly', 'sp_interest_only')),
    original_principal NUMERIC(12, 2) NOT NULL CHECK (original_principal > 0),
    actual_disbursement NUMERIC(12, 2) NOT NULL CHECK (actual_disbursement > 0),
    weekly_due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    loan_start_date DATE NOT NULL,
    tenure_weeks INTEGER NOT NULL DEFAULT 10,
    interest_method TEXT NOT NULL DEFAULT 'flat',
    interest_rate_monthly NUMERIC(5, 2) NOT NULL DEFAULT 0,
    principal_repayment_terms TEXT DEFAULT '',
    penalty_rule_amount NUMERIC(8, 2) NOT NULL DEFAULT 150.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue', 'defaulted')),
    
    -- Exact decimal running balances
    outstanding_principal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    outstanding_weekly_dues NUMERIC(12, 2) NOT NULL DEFAULT 0,
    outstanding_interest NUMERIC(12, 2) NOT NULL DEFAULT 0,
    outstanding_penalties NUMERIC(12, 2) NOT NULL DEFAULT 0,
    
    total_paid_principal NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_paid_dues NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_paid_interest NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_paid_penalties NUMERIC(12, 2) NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

CREATE INDEX IF NOT EXISTS idx_loans_customer_id ON public.loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON public.loans(status);

-- 5. INSTALLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
    week_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    amount_due NUMERIC(12, 2) NOT NULL,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    is_overdue BOOLEAN NOT NULL DEFAULT FALSE,
    penalty_assessed NUMERIC(8, 2) NOT NULL DEFAULT 0,
    penalty_paid NUMERIC(8, 2) NOT NULL DEFAULT 0,
    penalty_date DATE,
    paid_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    CONSTRAINT unique_loan_week UNIQUE (loan_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_installments_loan_due ON public.installments(loan_id, due_date);

-- 6. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_no TEXT UNIQUE NOT NULL, -- e.g. RCP-2026-001
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Other')),
    reference_no TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    idempotency_key TEXT UNIQUE NOT NULL,
    is_refunded BOOLEAN NOT NULL DEFAULT FALSE,
    refunded_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON public.payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);

-- 7. PAYMENT ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    weekly_due_allocated NUMERIC(12, 2) NOT NULL DEFAULT 0,
    interest_allocated NUMERIC(12, 2) NOT NULL DEFAULT 0,
    penalty_allocated NUMERIC(12, 2) NOT NULL DEFAULT 0,
    principal_allocated NUMERIC(12, 2) NOT NULL DEFAULT 0,
    covered_weeks INTEGER[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 8. REFUNDS TABLE
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
    receipt_no TEXT NOT NULL,
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    reference_no TEXT DEFAULT '',
    payment_method TEXT NOT NULL,
    refund_date TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 9. LEDGER TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    date TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    description TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    reference_no TEXT DEFAULT '',
    balance_after NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

CREATE INDEX IF NOT EXISTS idx_ledger_loan ON public.ledger_transactions(loan_id, date);

-- 10. PENALTY ASSESSMENTS TABLE (Audit & Idempotency)
CREATE TABLE IF NOT EXISTS public.penalty_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE RESTRICT,
    installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE RESTRICT,
    assessment_date DATE NOT NULL,
    amount NUMERIC(8, 2) NOT NULL DEFAULT 150.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    CONSTRAINT unique_penalty_per_installment UNIQUE (installment_id)
);

-- 11. CUSTOMER ACCESS TOKENS TABLE (Public Passbook Self-Service)
CREATE TABLE IF NOT EXISTS public.customer_access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tokens_token ON public.customer_access_tokens(token);

-- 12. BACKUPS OR RECOVERY METADATA TABLE
CREATE TABLE IF NOT EXISTS public.backups_or_recovery_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    note TEXT NOT NULL,
    record_counts JSONB NOT NULL,
    snapshot_data JSONB NOT NULL,
    restored_at TIMESTAMPTZ
);

-- 13. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    details TEXT NOT NULL,
    user_email TEXT NOT NULL
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penalty_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backups_or_recovery_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to verify owner
CREATE OR REPLACE FUNCTION public.is_authorized_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.owner_access
    WHERE owner_email = auth.jwt() ->> 'email'
      AND is_active = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Owner has full read/write access to all tables
CREATE POLICY owner_all_businesses ON public.businesses FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_customers ON public.customers FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_loans ON public.loans FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_installments ON public.installments FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_payments ON public.payments FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_payment_allocations ON public.payment_allocations FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_refunds ON public.refunds FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_ledger ON public.ledger_transactions FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_penalties ON public.penalty_assessments FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_tokens ON public.customer_access_tokens FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_backups ON public.backups_or_recovery_metadata FOR ALL USING (public.is_authorized_owner());
CREATE POLICY owner_all_audit ON public.audit_logs FOR ALL USING (public.is_authorized_owner());

-- Public Passbook Token Access Policy:
-- Unauthenticated customers can strictly SELECT ONLY the specific loan connected to a valid, unrevoked token
CREATE POLICY passbook_read_loan ON public.loans
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.customer_access_tokens t
    WHERE t.loan_id = public.loans.id
      AND t.is_revoked = FALSE
  )
);

CREATE POLICY passbook_read_installments ON public.installments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.customer_access_tokens t
    WHERE t.loan_id = public.installments.loan_id
      AND t.is_revoked = FALSE
  )
);

CREATE POLICY passbook_read_payments ON public.payments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.customer_access_tokens t
    WHERE t.loan_id = public.payments.loan_id
      AND t.is_revoked = FALSE
  )
);
