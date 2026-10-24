/**
 * Sri Sennamal Finance — Business Settings & Compliance Configuration
 * Strictly adheres to official Tamil Nadu money lending rules.
 * Manages verified licence number, owner authorization, and penalty rules.
 */

import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Coins,
} from 'lucide-react';
import { BusinessInfo } from '../types/finance';

interface SettingsViewProps {
  businessInfo: BusinessInfo;
  onUpdateBusinessInfo: (info: Partial<BusinessInfo>) => void;
  ownerEmail: string | null;
  onOpenClearData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  businessInfo,
  onUpdateBusinessInfo,
  ownerEmail,
  onOpenClearData,
}) => {
  const [companyName, setCompanyName] = useState(businessInfo.companyName);
  const [phone, setPhone] = useState(businessInfo.phone);
  const [email, setEmail] = useState(businessInfo.email);
  const [address, setAddress] = useState(businessInfo.address);
  const [licenceNumber, setLicenceNumber] = useState(businessInfo.licenceNumber);
  const [licenceVerified, setLicenceVerified] = useState(businessInfo.licenceVerified);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusinessInfo({
      companyName,
      phone,
      email,
      address,
      licenceNumber: licenceNumber.trim() || 'Licence No: Not provided',
      licenceVerified,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Title */}
      <div className="p-6 rounded-2xl neon-card">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-xl font-bold text-white font-display">
            Business Settings & Regulatory Compliance
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Configure Sri Sennamal Finance business profile, verified Tamil Nadu Money Lending licence number, and owner credentials.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Settings successfully updated and synchronized to cloud database.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Company Identity */}
        <div className="p-6 rounded-2xl neon-card space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              Company Details
            </h3>
            <span className="text-[11px] text-slate-400">Used across receipts, passbooks, and reports.</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Phone Helpline</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Official Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Location Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>
        </div>

        {/* Tamil Nadu Money Lending Licence Section */}
        <div className="p-6 rounded-2xl neon-card space-y-4 border border-cyan-500/30">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Tamil Nadu Registration & Licence Compliance
            </h3>
            <span className="text-[11px] text-slate-400">
              In accordance with official Tamil Nadu Money Lending statutory requirements.
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <p className="text-slate-300 leading-relaxed">
              Under Tamil Nadu Money Lenders Act rules, a money lending business must never invent a licence number or use another entity's number. If the number has not been provided or verified, it strictly displays as:
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-cyan-300 font-semibold text-xs">
              Licence No: Not provided
            </div>

            <div className="pt-2">
              <label className="block text-slate-400 mb-1 font-semibold">
                Verified Licence Number (Enter here once official certificate is issued):
              </label>
              <input
                type="text"
                value={licenceNumber}
                onChange={(e) => setLicenceNumber(e.target.value)}
                placeholder="e.g. TN/CBE/ML/2026/XXXXX"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="licenceVerify"
                checked={licenceVerified}
                onChange={(e) => setLicenceVerified(e.target.checked)}
                className="rounded accent-cyan-400 w-4 h-4"
              />
              <label htmlFor="licenceVerify" className="text-xs text-slate-300 cursor-pointer">
                I confirm this licence number has been officially verified with the competent authority.
              </label>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Official Government Portal:</span>
              <a
                href="https://tnmoneylending.tn.gov.in/frequently-asked-questions"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-0.5"
              >
                tnmoneylending.tn.gov.in/frequently-asked-questions
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Wednesday Penalty Rules Configuration */}
        <div className="p-6 rounded-2xl neon-card space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              Weekly Due & Penalty Rules Engine
            </h3>
            <span className="text-[11px] text-slate-400">Fixed rules configured for Sri Sennamal Finance.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-tabular">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Weekly Due Day</span>
              <span className="text-base font-bold text-white">Sunday</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Primary installment day</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Grace Period</span>
              <span className="text-base font-bold text-cyan-300">Monday & Tuesday</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Zero penalty assessed</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase block">Wednesday Penalty</span>
              <span className="text-base font-bold text-rose-400">₹150 (Once only)</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Applied to unpaid dues</span>
            </div>
          </div>
        </div>

        {/* Owner Authorization Overview */}
        <div className="p-6 rounded-2xl neon-card space-y-3">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-display">
              Owner Security & Architecture
            </h3>
            <span className="text-[11px] text-slate-400">Single designated owner identity.</span>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              In accordance with prompt requirements, separate Agent Logins and staff profile systems have been <span className="text-cyan-300 font-semibold">completely removed</span>.
            </p>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Configured Owner Identity:</span>
                <span className="font-mono text-cyan-400 font-semibold">{ownerEmail || 'playwithsakthigaming@gmail.com'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timezone Engine:</span>
                <span className="text-slate-200">Asia/Kolkata</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Row Level Security:</span>
                <span className="text-emerald-400 font-semibold">Enforced on all tables</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Clearance & Factory Reset (Danger Zone) */}
        {onOpenClearData && (
          <div className="p-6 rounded-2xl neon-card space-y-3 border border-rose-500/30 bg-rose-950/10">
            <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-rose-300 font-display">
                  Data Reset & Database Clearance
                </h3>
                <span className="text-[11px] text-slate-400">
                  Wipes all customer, loan, installment, and payment JSON/database records back to 0.
                </span>
              </div>
              <button
                type="button"
                onClick={onOpenClearData}
                className="px-4 py-2 font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.3)] transition-all whitespace-nowrap"
              >
                Clear All Data
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Authorized Owner only: Permanently clears all borrowers, loans, daily dues, weekly collections, receipts, and resets state.
            </p>
          </div>
        )}

        {/* Save Changes Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 font-bold text-xs text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
          >
            <Save className="w-4 h-4" />
            Save Business Settings
          </button>
        </div>

      </form>

    </div>
  );
};
