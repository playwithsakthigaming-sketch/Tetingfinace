# Sri Sennamal Finance — Production Weekly Loan & Finance Platform

A production-grade, secure, cloud-connected finance and weekly loan collection management platform engineered for **Sri Sennamal Finance**, Coimbatore, Tamil Nadu.

Built with **React + TypeScript**, **Tailwind CSS**, **Supabase PostgreSQL & Auth**, and deployment-ready for **Vercel**.

---

## 1. Business Profile & Official Details

| Attribute | Detail |
| :--- | :--- |
| **Company Name** | Sri Sennamal Finance |
| **Phone** | `7812834522` |
| **Email** | `playwithsakthigaming@gmail.com` |
| **Headquarters** | Coimbatore, Tamil Nadu, India |
| **Operating Currency** | Indian Rupee (`₹`) |
| **Timezone** | `Asia/Kolkata` |
| **Licence Status** | `Licence No: Not provided` (Default unverified fallback) |
| **Statutory Reference** | [Tamil Nadu Money Lending Regulations](https://tnmoneylending.tn.gov.in/frequently-asked-questions) |

> **Licence Compliance Note**: Never invent or fabricate a money lending licence number. The owner may enter the verified licence registration certificate number in the **Settings** view once officially issued.

---

## 2. Key Architecture & Business Rules

### A. Sole Owner Authentication (Zero Agent / Separate Admin Logins)
- **Single Owner Login**: Only the configured owner (`playwithsakthigaming@gmail.com`) can access internal management, loans, collections, refunds, and settings.
- **Agent and Staff Logins Removed**: All agent accounts, staff roles, and separate administrative portals have been completely eliminated.
- **Supabase Authentication**: Integrated via `@supabase/supabase-js` with email/password login, password visibility toggles, and secure password recovery.

### B. Weekly Due and Penalty Rules
- **Weekly Due Day**: **Sunday**
- **Grace Period**: **Monday & Tuesday** (Zero late penalties applied).
- **Wednesday Onward**: Automatic assessment of **₹150 penalty** per eligible unpaid weekly installment.
- **Idempotency**: Penalty is applied **strictly once per installment**.
- **No Penalties on Paid Installments**: Fully settled installments are never penalized. Partial payments are tracked accurately.

### C. Multiple Weekly Due Collection Desk
- Supports collecting multiple installments (e.g., ₹500/week × 10 weeks = ₹5,000) in a single visit.
- **Method 1**: Enter total cash amount received.
- **Method 2**: Select number of installments (or check specific weeks).
- **Excess Amount Handling**: Prompts owner for allocation preference (Next Weekly Due, Principal Repayment, or Customer Advance). Never silently reallocated.

### D. SP Loan (Interest-Only) Rules
- Interest payments **do not reduce principal**.
- Principal repayments are recorded separately.
- Once principal is fully repaid, **future interest stops accruing immediately**.
- Never charges interest on principal already repaid.

### E. Simplified 8-Field Printable Receipt
Conforms strictly to the 8 required fields:
1. `Receipt No`
2. `Loan ID`
3. `Date`
4. `Customer Name`
5. `Current Due` (e.g., "Week 1", "Week 1–10")
6. `Amount Received`
7. `Reference Number`
8. `Payment Method` (Cash, UPI, Bank Transfer, Other)

### F. Self-Service Customer Passbook (`?track=TOKEN` or `#track=TOKEN`)
- High-entropy cryptographic tracking tokens per customer loan.
- Zero customer account creation or password required.
- Restricted strictly to the authorized borrower's own loan schedule and payment receipts.
- Direct management buttons in Customer Details:
  - `Copy Passbook Link`
  - `Open Passbook`
  - `Revoke Passbook Link`
  - `Generate Replacement Link`

### G. Auto Save & Restore Auto Save (Exactly Two Options)
- **Option 1: Auto Save**: Live continuous cloud saving; commits transactions atomically and indicates `Saving...`, `Saved`, or `Save Failed`.
- **Option 2: Restore Auto Save**: Rollback to a verified recovery point snapshot. Automatically captures a safety snapshot before executing.
- **Restore Restrictions**: "Delete Balance" is **completely removed and absent**. No financial records are erased during restore.

---

## 3. 24 Automated Financial & Security Tests

The platform includes an interactive, deterministic test suite covering all 24 required test scenarios:
1. Sunday due date check
2. Monday and Tuesday grace period (no penalty)
3. One ₹150 penalty from Wednesday onward
4. No duplicate penalties on already assessed installments
5. Ten installments collected in one visit (₹500 × 10 = ₹5,000)
6. Partial installment payment allocation
7. SP loan interest payment does not reduce principal
8. Principal repayment ceases future interest once principal is ₹0
9. Full and partial refund tracking
10. Refund amount validation prevents over-refunding
11. Duplicate payment prevention via idempotency keys
12. Correct payment allocation (penalty priority over regular due)
13. Owner email authentication verification (`playwithsakthigaming@gmail.com`)
14. Unauthorized user blocked from management dashboard
15. Passbook token restricted to the authorized loan
16. Revoked passbook token ceases to grant access
17. Auto Save reflects actual database confirmation
18. Restore Auto Save safely restores a verified recovery point
19. Restoration does not duplicate transactions or IDs
20. Delete Balance option is absent
21. Multi-device data schema consistency check
22. Receipt contains only the 8 required simplified fields
23. Loan balances are strictly isolated per loan
24. Public users cannot modify financial records (read-only token)

---

## 4. Supabase Setup Instructions

1. Create a new Supabase project at [https://supabase.com](https://supabase.com).
2. Go to **SQL Editor** in the Supabase Dashboard.
3. Paste and run the complete SQL migration file located at:
   ```
   /supabase/migrations/20261023_initial_schema.sql
   ```
4. In Supabase **Authentication** -> **Users**, invite or register the designated owner email:
   ```
   playwithsakthigaming@gmail.com
   ```
5. Copy your **Project URL** and **Anon Key** from **Project Settings** -> **API**.
6. Set them in your environment variables:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
   VITE_OWNER_EMAIL="playwithsakthigaming@gmail.com"
   ```

---

## 5. Vercel Deployment Instructions

1. Push your repository to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: Sri Sennamal Finance production release"
   git remote add origin https://github.com/YOUR_USERNAME/sri-sennamal-finance.git
   git push -u origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set the **Framework Preset** to **Vite**.
5. Under **Environment Variables**, add:
   - `VITE_OWNER_EMAIL` = `playwithsakthigaming@gmail.com`
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
   - `APP_URL` = `https://your-domain.vercel.app`
6. Click **Deploy**. Vercel will automatically run `npm run build` and launch your site.

---

## 6. Troubleshooting

- **Passbook Link Shows Revoked**: Navigate to **Customers**, click the borrower, and click **"Generate Replacement Link"** or **"Copy Link"**.
- **Wednesday Penalty Not Assessed Yet**: Click **"Run Wednesday Penalty Check"** in the Dashboard or on the top alert banner.
- **Receipt Print Layout**: Click **"Print Receipt"** on any invoice modal. Print CSS isolates the 8-field receipt cleanly on desktop and mobile printers.

---

*Sri Sennamal Finance · Coimbatore, Tamil Nadu · Helpline: 7812834522*
