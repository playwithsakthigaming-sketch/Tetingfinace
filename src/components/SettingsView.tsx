/**
 * Sri Sennamal Finance — Business Settings & Compliance Configuration
 * Strictly adheres to official Tamil Nadu money lending rules.
 * Manages verified licence number, owner authorization, penalty rules,
 * and Cloud Database Connection (Supabase Connect DB).
 */

import React, { useState, useEffect } from 'react';
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
  Database,
  RefreshCw,
  Copy,
  Check,
  Sliders,
  CheckCircle2,
  Lock,
  User,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { BusinessInfo, UserProfile, UserRole, ROLE_LABELS, ROLE_PERMISSIONS } from '../types/finance';
import {
  getActiveSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
  subscribeToSupabaseHealth,
  ConnectionHealth,
  runHealthCheck,
  SupabaseConfig,
} from '../services/supabase';
import { userService, subscribeToUserProfiles } from '../services/userService';

interface SettingsViewProps {
  businessInfo: BusinessInfo;
  onUpdateBusinessInfo: (info: Partial<BusinessInfo>) => void;
  ownerEmail: string | null;
  onOpenClearData?: () => void;
  onOpenProfile?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  businessInfo,
  onUpdateBusinessInfo,
  ownerEmail,
  onOpenClearData,
  onOpenProfile,
}) => {
  // Business Info form state
  const [companyName, setCompanyName] = useState(businessInfo.companyName);
  const [phone, setPhone] = useState(businessInfo.phone);
  const [email, setEmail] = useState(businessInfo.email);
  const [address, setAddress] = useState(businessInfo.address);
  const [licenceNumber, setLicenceNumber] = useState(businessInfo.licenceNumber);
  const [licenceVerified, setLicenceVerified] = useState(businessInfo.licenceVerified);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Supabase Connect DB state & live health monitor
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => getActiveSupabaseConfig());
  const [dbHealth, setDbHealth] = useState<ConnectionHealth>({
    status: getActiveSupabaseConfig().isConfigured ? 'connecting' : 'offline',
    isConfigured: getActiveSupabaseConfig().isConfigured,
    url: getActiveSupabaseConfig().url,
    latencyMs: null,
    lastPingAt: null,
    consecutiveFailures: 0,
    errorMessage: null,
  });
  const [dbUrl, setDbUrl] = useState(supabaseConfig.url || '');
  const [dbKey, setDbKey] = useState(supabaseConfig.anonKey || '');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null);
  const [dbSaveMessage, setDbSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Team & User Roles state
  const [profiles, setProfiles] = useState<UserProfile[]>(() => userService.getAllProfiles());
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);
  const [syncUserFeedback, setSyncUserFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<UserRole>('collection_team');
  const [addMemberFeedback, setAddMemberFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  // Subscribe to live connection health and user profile changes
  useEffect(() => {
    const unsubscribeDb = subscribeToSupabaseHealth((health) => {
      setDbHealth(health);
      const cfg = getActiveSupabaseConfig();
      setSupabaseConfig(cfg);
    });

    const unsubscribeProfiles = subscribeToUserProfiles(() => {
      setProfiles(userService.getAllProfiles());
    });

    return () => {
      unsubscribeDb();
      unsubscribeProfiles();
    };
  }, []);

  // Sync users with Supabase
  const handleSyncUsers = async () => {
    setIsSyncingUsers(true);
    setSyncUserFeedback(null);
    try {
      const res = await userService.syncWithSupabase();
      setSyncUserFeedback({
        ok: res.success,
        message: res.message,
      });
      setProfiles(userService.getAllProfiles());
    } catch (err: any) {
      setSyncUserFeedback({
        ok: false,
        message: err?.message || 'Error syncing users with Supabase.',
      });
    } finally {
      setIsSyncingUsers(false);
      setTimeout(() => {
        setSyncUserFeedback((prev) => (prev?.ok ? null : prev));
      }, 6000);
    }
  };

  // Change user role
  const handleRoleChange = async (targetEmail: string, newRole: UserRole) => {
    await userService.saveProfile(targetEmail, { role: newRole });
    setProfiles(userService.getAllProfiles());
  };

  // Add new team member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMemberFeedback(null);
    const res = await userService.addNewMember(
      newMemberEmail,
      newMemberName,
      newMemberRole,
      newMemberPhone
    );
    setAddMemberFeedback({ ok: res.success, message: res.message });
    if (res.success) {
      setNewMemberEmail('');
      setNewMemberName('');
      setNewMemberPhone('');
      setNewMemberRole('collection_team');
      setProfiles(userService.getAllProfiles());
      setTimeout(() => {
        setIsAddUserModalOpen(false);
        setAddMemberFeedback(null);
      }, 1500);
    }
  };

  // Delete member
  const handleDeleteMember = (targetEmail: string) => {
    if (window.confirm(`Are you sure you want to remove team member ${targetEmail}?`)) {
      userService.deleteMember(targetEmail);
      setProfiles(userService.getAllProfiles());
    }
  };

  // SQL Migration Modal state
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

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

  // Test Supabase Database Connection
  const handleTestDbConnection = async () => {
    setIsTestingDb(true);
    setDbTestResult(null);
    setDbSaveMessage(null);

    try {
      const res = await testSupabaseConnection(dbUrl, dbKey);
      setDbTestResult(res);
    } catch (err: any) {
      setDbTestResult({ ok: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setIsTestingDb(false);
    }
  };

  // Save Supabase Database Credentials
  const handleSaveDbConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setDbTestResult(null);

    const result = saveCustomSupabaseConfig(dbUrl, dbKey);
    if (!result.success) {
      setDbSaveMessage({ ok: false, text: result.error || 'Failed to save configuration.' });
      return;
    }

    const updated = getActiveSupabaseConfig();
    setSupabaseConfig(updated);
    setDbSaveMessage({ ok: true, text: 'Supabase Database credentials connected & saved successfully!' });
    setTimeout(() => setDbSaveMessage(null), 5000);
  };

  // Disconnect / Reset Database to Local Offline Mode
  const handleClearDbConfig = () => {
    clearCustomSupabaseConfig();
    const updated = getActiveSupabaseConfig();
    setSupabaseConfig(updated);
    setDbUrl('');
    setDbKey('');
    setDbTestResult(null);
    setDbSaveMessage({ ok: true, text: 'Supabase cloud connection disconnected. Running in Local Storage Mode.' });
    setTimeout(() => setDbSaveMessage(null), 4000);
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
          Configure Sri Sennamal Finance business profile, verified Tamil Nadu Money Lending licence number, and connect Supabase cloud database.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Settings successfully updated and saved.</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. CONNECT DB (SUPABASE CLOUD DATABASE CONNECTION) CARD */}
      {/* ======================================================== */}
      <div className="p-6 rounded-2xl neon-card space-y-4 border border-cyan-500/40 bg-[#090e1a]/95">
        <div className="pb-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                Connect DB (Supabase Database Connection)
              </h3>
              <p className="text-[11px] text-slate-400">
                Connect your cloud PostgreSQL database for persistent customer records, loans, and ledger sync.
              </p>
            </div>
          </div>

          {/* Connection Status Pill */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium border ${
                dbHealth.status === 'online'
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                  : dbHealth.status === 'connecting'
                  ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300'
                  : 'bg-amber-950/50 border-amber-500/50 text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dbHealth.status === 'online'
                    ? 'bg-emerald-400 animate-pulse'
                    : dbHealth.status === 'connecting'
                    ? 'bg-cyan-400 animate-spin'
                    : 'bg-amber-400'
                }`}
              />
              <span>
                {dbHealth.status === 'online'
                  ? `Cloud DB Online (${dbHealth.latencyMs ? `${dbHealth.latencyMs}ms` : 'Connected'})`
                  : dbHealth.status === 'connecting'
                  ? 'Waking / Reconnecting...'
                  : 'Local Offline Storage Mode'}
              </span>
            </div>

            {dbHealth.isConfigured && (
              <button
                type="button"
                onClick={() => runHealthCheck()}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                title="Trigger immediate health ping / keep-alive probe"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status & Feedback Banners */}
        {dbSaveMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              dbSaveMessage.ok
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            {dbSaveMessage.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{dbSaveMessage.text}</span>
          </div>
        )}

        {dbTestResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              dbTestResult.ok
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
          >
            {dbTestResult.ok ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{dbTestResult.message}</span>
          </div>
        )}

        {/* Database Connection Form */}
        <form onSubmit={handleSaveDbConfig} className="space-y-4 text-xs pt-1">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supabase Project URL (VITE_SUPABASE_URL) *
            </label>
            <input
              type="url"
              required
              placeholder="https://your-project-id.supabase.co"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-none transition-colors"
            />
            <span className="text-[10.5px] text-slate-500 mt-1 block">
              Found in: <strong>Supabase Dashboard → Project Settings → API → Project URL</strong>
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Supabase Anon Public API Key (VITE_SUPABASE_ANON_KEY) *
            </label>
            <textarea
              required
              rows={2}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={dbKey}
              onChange={(e) => setDbKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-none text-[11px] transition-colors"
            />
            <span className="text-[10.5px] text-slate-500 mt-1 block">
              Found in: <strong>Supabase Dashboard → Project Settings → API → Project API Keys (anon public)</strong>
            </span>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isTestingDb || !dbUrl || !dbKey}
                onClick={handleTestDbConnection}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-colors"
              >
                {isTestingDb ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>{isTestingDb ? 'Testing Connection...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsSqlModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Database className="w-3.5 h-3.5" />
                <span>View SQL Migration Script</span>
              </button>

              {supabaseConfig.source === 'custom' && (
                <button
                  type="button"
                  onClick={handleClearDbConfig}
                  className="px-3 py-2 text-rose-400 hover:text-rose-300 text-xs hover:underline"
                >
                  Disconnect Cloud DB
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#00e5ff] hover:bg-[#38bdf8] text-black font-bold text-xs shadow-[0_0_15px_rgba(0,229,255,0.3)] transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save & Connect DB</span>
            </button>
          </div>
        </form>
      </div>

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

        {/* ======================================================== */}
        {/* 4. TEAM MEMBERS, SUPABASE SYNC & ROLE-BASED ACCESS (RBAC) */}
        {/* ======================================================== */}
        <div className="p-6 rounded-2xl neon-card space-y-4 border border-cyan-500/30 bg-[#090e1a]/95">
          <div className="pb-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  Team Members & Supabase Users Sync
                </h3>
                <p className="text-[11px] text-slate-400">
                  Manage staff roles: <strong>Administrator</strong>, <strong>Manager</strong>, and <strong>Collection Team</strong> with role-based permissions.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>My Profile</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSyncUsers}
                disabled={isSyncingUsers}
                className="px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/50 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="Sync users and profiles with Supabase Cloud Database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingUsers ? 'animate-spin text-cyan-400' : ''}`} />
                <span>{isSyncingUsers ? 'Syncing...' : 'Sync Supabase Users'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            </div>
          </div>

          {/* Sync Feedback Toast */}
          {syncUserFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                syncUserFeedback.ok
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
              }`}
            >
              {syncUserFeedback.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
              <span>{syncUserFeedback.message}</span>
            </div>
          )}

          {/* Role Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                roleFilter === 'all'
                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Members ({profiles.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('admin')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                roleFilter === 'admin'
                  ? 'bg-amber-950/70 border border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Admins ({profiles.filter((p) => p.role === 'admin').length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('manager')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                roleFilter === 'manager'
                  ? 'bg-cyan-950/70 border border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Managers ({profiles.filter((p) => p.role === 'manager').length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter('collection_team')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                roleFilter === 'collection_team'
                  ? 'bg-emerald-950/70 border border-emerald-500 text-emerald-300 font-bold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Collection Team ({profiles.filter((p) => p.role === 'collection_team').length})
            </button>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-900/80">
                  <th className="py-2.5 px-3">Team Member</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Assigned Role & Permissions</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-tabular">
                {profiles
                  .filter((p) => roleFilter === 'all' || p.role === roleFilter)
                  .map((p) => {
                    const isSelf = ownerEmail?.toLowerCase() === p.email.toLowerCase();
                    const isOwnerAccount = p.email.toLowerCase() === 'playwithsakthigaming@gmail.com';
                    const roleBadge = ROLE_LABELS[p.role] || ROLE_LABELS.collection_team;

                    return (
                      <tr key={p.email} className="hover:bg-slate-900/40 transition-colors">
                        {/* Member Identity & Avatar */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-900 border border-cyan-500/40 shrink-0 flex items-center justify-center">
                              {p.avatarUrl ? (
                                <img
                                  src={p.avatarUrl}
                                  alt={p.displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-bold text-cyan-300 uppercase">
                                  {(p.displayName || p.email).charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white truncate">{p.displayName}</span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 text-[9px] font-mono border border-cyan-500/30">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 truncate block font-mono">
                                {p.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                          {p.phone || <span className="text-slate-500 italic">No phone set</span>}
                        </td>

                        {/* Role Selector */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={p.role}
                              onChange={(e) => handleRoleChange(p.email, e.target.value as UserRole)}
                              disabled={isOwnerAccount}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-900 focus:outline-none focus:border-cyan-400 transition-colors cursor-pointer ${roleBadge.badgeColor} ${
                                isOwnerAccount ? 'opacity-80 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="admin" className="bg-slate-900 text-amber-300">
                                Administrator (முழு நிர்வாகி)
                              </option>
                              <option value="manager" className="bg-slate-900 text-cyan-300">
                                Manager (மேலாளர்)
                              </option>
                              <option value="collection_team" className="bg-slate-900 text-emerald-300">
                                Collection Team (வசூல் குழு)
                              </option>
                            </select>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              p.isActive
                                ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${p.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                            {p.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center">
                          {isOwnerAccount ? (
                            <span className="text-[10px] text-slate-500 font-mono">Designated Owner</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDeleteMember(p.email)}
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title={`Remove ${p.email}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Role Permissions Matrix Card (அனுமதி அட்டவணை) */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-cyan-400" />
                Role Permissions Matrix (பாத்திர அனுமதி அட்டவணை)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Strict Access Control</span>
            </div>

            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                    <th className="py-1.5">Feature & Action</th>
                    <th className="py-1.5 px-2 text-center text-amber-300">Admin (முழு நிர்வாகி)</th>
                    <th className="py-1.5 px-2 text-center text-cyan-300">Manager (மேலாளர்)</th>
                    <th className="py-1.5 px-2 text-center text-emerald-300">Collection Team (வசூல் குழு)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 font-tabular text-slate-300">
                  <tr>
                    <td className="py-1.5">Due Collections & Receipt Generation</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Customer Registry & Passbook Links</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-cyan-300 font-medium">View Contact Only</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Loan Creation & Disbursement</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-rose-400">✗ Blocked</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Refunds & Reversals</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-rose-400">✗ Blocked</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Financial Reports & Profit/Loss</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-rose-400">✗ Blocked</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Customer Ledger (Day Book)</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-rose-400">✗ Blocked</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Settings & Cloud Supabase Sync</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-rose-400">✗ Blocked</td>
                    <td className="py-1.5 px-2 text-center text-rose-400">✗ Blocked</td>
                  </tr>
                  <tr>
                    <td className="py-1.5">User Roles & Permission Assignment</td>
                    <td className="py-1.5 px-2 text-center text-emerald-400 font-bold">✓ Full</td>
                    <td className="py-1.5 px-2 text-center text-rose-400">✗ Blocked</td>
                    <td className="py-1.5 px-2 text-center text-rose-400">✗ Blocked</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ADD TEAM MEMBER MODAL */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#090e1a] border border-cyan-500/40 rounded-2xl shadow-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white font-display">Add New Team Member</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {addMemberFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    addMemberFeedback.ok
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {addMemberFeedback.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{addMemberFeedback.message}</span>
                </div>
              )}

              <form onSubmit={handleAddMember} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. staff@srisennamal.com or user@gmail.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Must match user email registered in Supabase Auth.
                  </span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. R. Selvam"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 9842100077"
                    value={newMemberPhone}
                    onChange={(e) => setNewMemberPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Assign Role *
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:border-cyan-400 focus:outline-none"
                  >
                    <option value="collection_team">Collection Team (வசூல் குழு - Field Collections & Receipts)</option>
                    <option value="manager">Manager (மேலாளர் - Loan Creation & Customer Ops)</option>
                    <option value="admin">Administrator (முழு நிர்வாகி - Full Access & Settings)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold hover:bg-cyan-300 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  >
                    Save & Assign Role
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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

      {/* SQL SCHEMA MIGRATION VIEWER MODAL */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0c1322] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-xs space-y-4 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Supabase SQL Migration Script</h3>
                  <p className="text-[10px] text-slate-400">Execute in your Supabase SQL Editor</p>
                </div>
              </div>
              <button
                onClick={() => setIsSqlModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-300 text-[11px] leading-relaxed">
              To setup your cloud database: Open <strong>Supabase Dashboard → SQL Editor → New Query</strong>, paste the script below, and click <strong>Run</strong>.
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[10.5px] text-slate-300">
              <pre className="whitespace-pre-wrap">
{`-- ====================================================================
-- SRI SENNAMAL FINANCE — SUPABASE POSTGRESQL PRODUCTION MIGRATION
-- Owner: playwithsakthigaming@gmail.com
-- ====================================================================

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

-- 2. OWNER ACCESS & USER PROFILES (RBAC)
CREATE TABLE IF NOT EXISTS public.owner_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_email TEXT UNIQUE NOT NULL,
    auth_user_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    role TEXT NOT NULL DEFAULT 'collection_team' CHECK (role IN ('admin', 'manager', 'collection_team')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

INSERT INTO public.owner_access (owner_email, is_active)
VALUES ('playwithsakthigaming@gmail.com', TRUE)
ON CONFLICT (owner_email) DO NOTHING;

INSERT INTO public.user_profiles (email, display_name, phone, role, is_active)
VALUES ('playwithsakthigaming@gmail.com', 'Sakthi (Owner)', '7812834522', 'admin', TRUE)
ON CONFLICT (email) DO UPDATE SET role = 'admin', is_active = TRUE;

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unique_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    loan_start_date DATE NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- 4. LOANS TABLE
CREATE TABLE IF NOT EXISTS public.loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loan_id TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    loan_type TEXT NOT NULL CHECK (loan_type IN ('standard_weekly', 'day_due_daily', 'sp_interest_only')),
    original_principal NUMERIC(12, 2) NOT NULL,
    actual_disbursement NUMERIC(12, 2) NOT NULL,
    weekly_due_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    loan_start_date DATE NOT NULL,
    tenure_weeks INTEGER NOT NULL,
    interest_method TEXT NOT NULL DEFAULT 'flat',
    interest_rate_monthly NUMERIC(5, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue', 'bad_debt')),
    outstanding_principal NUMERIC(12, 2) NOT NULL,
    outstanding_weekly_dues NUMERIC(12, 2) NOT NULL DEFAULT 0,
    outstanding_interest NUMERIC(12, 2) NOT NULL DEFAULT 0,
    outstanding_penalties NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

-- (Complete migration script available in /supabase/migrations/20261023_initial_schema.sql)`}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-500">File: /supabase/migrations/20261023_initial_schema.sql</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`-- SRI SENNAMAL FINANCE SUPABASE MIGRATION\n-- See /supabase/migrations/20261023_initial_schema.sql`);
                  setSqlCopied(true);
                  setTimeout(() => setSqlCopied(false), 2000);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold flex items-center gap-1.5"
              >
                {sqlCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{sqlCopied ? 'Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
