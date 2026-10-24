/**
 * Sri Sennamal Finance — Customer Management
 * Search by name/phone/ID, profile view with isolated loan balances,
 * and Passbook Link management (Copy, Open, Revoke, Regenerate).
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  Copy,
  RefreshCw,
  Ban,
  Check,
  Edit2,
  FileText,
  CreditCard,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Customer, CustomerAccessToken, Loan, Payment } from '../types/finance';
import { formatIndianCurrency } from '../utils/financeCalculations';

interface CustomerManagementProps {
  customers: Customer[];
  loans: Loan[];
  payments: Payment[];
  tokens: CustomerAccessToken[];
  onAddCustomer: (data: Omit<Customer, 'id' | 'uniqueId' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onToggleStatus: (id: string) => void;
  onGenerateToken: (customerId: string, loanId: string) => CustomerAccessToken;
  onRevokeToken: (tokenId: string) => void;
  onOpenPassbookInApp: (tokenStr: string) => void;
  onSelectCustomerLoan: (loanId: string) => void;
  canManageCustomers?: boolean;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  loans,
  payments,
  tokens,
  onAddCustomer,
  onUpdateCustomer,
  onToggleStatus,
  onGenerateToken,
  onRevokeToken,
  onOpenPassbookInApp,
  onSelectCustomerLoan,
  canManageCustomers = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Search Filter (by name, phone, or unique ID)
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.uniqueId.toLowerCase().includes(q) ||
      c.address.toLowerCase().includes(q)
    );
  });

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;
  const customerLoans = selectedCustomer
    ? loans.filter((l) => l.customerId === selectedCustomer.id)
    : [];

  const handleOpenAdd = () => {
    setFormName('');
    setFormPhone('');
    setFormAddress('Coimbatore, Tamil Nadu');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormName(c.fullName);
    setFormPhone(c.phone);
    setFormAddress(c.address);
    setFormStartDate(c.loanStartDate);
    setFormNotes(c.notes);
    setFormError(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      setFormError('Customer name and phone number are required.');
      return;
    }
    // Prevent duplicate phone
    const exists = customers.find((c) => c.phone.trim() === formPhone.trim());
    if (exists) {
      setFormError(`Customer with phone number ${formPhone} already exists (${exists.fullName} - ${exists.uniqueId}).`);
      return;
    }

    onAddCustomer({
      fullName: formName.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
      loanStartDate: formStartDate,
      notes: formNotes.trim(),
      status: 'active',
    });

    setIsAddModalOpen(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    onUpdateCustomer(editingCustomer.id, {
      fullName: formName.trim(),
      phone: formPhone.trim(),
      address: formAddress.trim(),
      loanStartDate: formStartDate,
      notes: formNotes.trim(),
    });

    setEditingCustomer(null);
  };

  const handleCopyPassbookLink = (tokenStr: string, tokenId: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/?track=${tokenStr}`;
    navigator.clipboard.writeText(link);
    setCopiedTokenId(tokenId);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Bar: Search & Add Customer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl neon-card">
        <div>
          <h2 className="text-xl font-bold text-white font-display">Customer Registry & Borrowers</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage profiles, verify phone numbers, view isolated loan ledgers, and manage public passbook tokens.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, or CUST ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 w-64 sm:w-72"
            />
          </div>
          {canManageCustomers ? (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          ) : (
            <span className="text-[10px] text-cyan-300 font-mono px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 whitespace-nowrap">
              Agent Look-up Mode
            </span>
          )}
        </div>
      </div>

      {/* Main Grid: Customer List & Customer Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Customer Table List (8 Cols) */}
        <div className="lg:col-span-7 rounded-2xl neon-card p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Borrower Records ({filteredCustomers.length})
            </span>
            <span className="text-[11px] text-slate-500">Click a customer to view profile & passbook</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Customer ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-tabular">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium text-xs">
                      No customer accounts found. Click "+ Register Customer" to create an account.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const isSelected = selectedCustomerId === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedCustomerId(c.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/40 text-cyan-200 border-l-2 border-cyan-400'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-medium text-cyan-400">
                          {c.uniqueId}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white">
                          {c.fullName}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {c.phone}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                              c.status === 'active'
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(c);
                            }}
                            className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 transition-colors"
                            title="Edit Customer Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Customer Profile & Passbook Controls (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl neon-card p-5">
          {selectedCustomer ? (
            <div className="space-y-5">
              
              {/* Profile Card Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-display">
                      {selectedCustomer.fullName}
                    </h3>
                    <span className="font-mono text-xs text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30">
                      {selectedCustomer.uniqueId}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {selectedCustomer.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Joined: {selectedCustomer.loanStartDate}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    {selectedCustomer.address}
                  </p>
                </div>

                <button
                  onClick={() => onToggleStatus(selectedCustomer.id)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors border ${
                    selectedCustomer.status === 'active'
                      ? 'text-rose-400 hover:bg-rose-950/40 border-rose-500/30'
                      : 'text-emerald-400 hover:bg-emerald-950/40 border-emerald-500/30'
                  }`}
                  title="Toggle active status without deleting financial records"
                >
                  {selectedCustomer.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>

              {/* Loans Belonging to this Customer (Strictly Isolated Balances) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
                    Customer Loans ({customerLoans.length})
                  </h4>
                  <span className="text-[10px] text-slate-500">Balances kept strictly separate</span>
                </div>

                {customerLoans.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No active loans for this customer.</p>
                ) : (
                  <div className="space-y-3">
                    {customerLoans.map((l) => {
                      const activeToken = tokens.find((t) => t.loanId === l.id && !t.isRevoked);

                      return (
                        <div
                          key={l.id}
                          className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-cyan-400">
                              {l.loanId}
                            </span>
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/20">
                              {l.loanType === 'sp_interest_only' ? 'SP Loan' : 'Weekly Loan'}
                            </span>
                          </div>

                          {/* Isolated Loan Balances Display */}
                          <div className="grid grid-cols-2 gap-2 text-xs font-tabular">
                            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                              <span className="text-[10px] text-slate-500 block">Principal Out.</span>
                              <span className="font-bold text-white">
                                {formatIndianCurrency(l.outstandingPrincipal)}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-slate-950/60 border border-slate-800/80">
                              <span className="text-[10px] text-slate-500 block">Weekly Dues Out.</span>
                              <span className="font-bold text-amber-400">
                                {formatIndianCurrency(l.outstandingWeeklyDues)}
                              </span>
                            </div>
                          </div>

                          {/* PASSBOOK BUTTONS DIRECTLY IN CUSTOMER DETAILS */}
                          <div className="pt-2 border-t border-slate-800/80">
                            <div className="flex items-center justify-between text-[11px] mb-2">
                              <span className="text-slate-400 font-medium">Customer Passbook Link:</span>
                              <span className="text-[10px] text-slate-500">
                                {activeToken ? 'Active & Valid' : 'Revoked / No Token'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {activeToken ? (
                                <>
                                  <button
                                    onClick={() => handleCopyPassbookLink(activeToken.token, activeToken.id)}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-cyan-500/30 transition-colors"
                                  >
                                    {copiedTokenId === activeToken.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        Copy Link
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => onOpenPassbookInApp(activeToken.token)}
                                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-cyan-950/50 hover:bg-cyan-900/50 text-cyan-400 rounded border border-cyan-500/30 transition-colors"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Open Passbook
                                  </button>

                                  <button
                                    onClick={() => onRevokeToken(activeToken.id)}
                                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 rounded border border-rose-500/30 transition-colors"
                                    title="Revoke passbook link immediately"
                                  >
                                    <Ban className="w-3 h-3" />
                                    Revoke
                                  </button>
                                </>
                              ) : null}

                              <button
                                onClick={() => onGenerateToken(selectedCustomer.id, l.id)}
                                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-purple-950/50 hover:bg-purple-900/50 text-purple-300 rounded border border-purple-500/30 transition-colors"
                              >
                                <RefreshCw className="w-3 h-3" />
                                {activeToken ? 'Replace Link' : 'Generate Link'}
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              Select a customer from the left to view profile, loans, and passbook tracking links.
            </div>
          )}
        </div>

      </div>

      {/* --- ADD CUSTOMER MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0c1322] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 neon-glow-cyan text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-display">Add New Customer</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveAdd} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Murugesan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number (10 digits) *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9842100000"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Residential / Business Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Registration Date</label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes / Business Profession</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Vegetable vendor, Town Hall market"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT CUSTOMER MODAL --- */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0c1322] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 neon-glow-cyan text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-display">Edit Customer Profile</h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow"
                >
                  Update Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
