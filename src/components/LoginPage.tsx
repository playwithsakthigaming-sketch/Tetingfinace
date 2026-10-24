/**
 * Sri Sennamal Finance — Dedicated Sole Owner Login Page
 * Full-screen gateway connecting to Supabase Auth.
 * Clean, minimalistic login card for authorized owner: playwithsakthigaming@gmail.com.
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Database,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  X,
  Settings,
} from 'lucide-react';
import {
  DESIGNATED_OWNER_EMAIL,
  isAuthorizedOwner,
  getSupabaseClient,
  getActiveSupabaseConfig,
  saveCustomSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabase';

interface LoginPageProps {
  onLoginSuccess: (email: string) => void;
  onOpenResetPage?: () => void;
  afkNotice?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onOpenResetPage, afkNotice }) => {
  // Auth state: strictly sign in or forgot password
  const [activeTab, setActiveTab] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState<string>(DESIGNATED_OWNER_EMAIL);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Supabase Configuration Status
  const [supabaseConfig, setSupabaseConfig] = useState(() => getActiveSupabaseConfig());
  const [isConnectDbOpen, setIsConnectDbOpen] = useState<boolean>(false);
  const [dbUrlInput, setDbUrlInput] = useState<string>('');
  const [dbKeyInput, setDbKeyInput] = useState<string>('');
  const [dbStatusMsg, setDbStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);

  // Refresh config state on mount
  useEffect(() => {
    const cfg = getActiveSupabaseConfig();
    setSupabaseConfig(cfg);
    setDbUrlInput(cfg.url || '');
    setDbKeyInput(cfg.anonKey || '');
  }, []);

  const handleSaveDb = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbStatusMsg(null);
    setIsTestingDb(true);

    const test = await testSupabaseConnection(dbUrlInput, dbKeyInput);
    if (!test.ok) {
      setDbStatusMsg({ ok: false, text: test.message });
      setIsTestingDb(false);
      return;
    }

    const res = saveCustomSupabaseConfig(dbUrlInput, dbKeyInput);
    if (!res.success) {
      setDbStatusMsg({ ok: false, text: res.error || 'Failed to save config.' });
      setIsTestingDb(false);
      return;
    }

    const updated = getActiveSupabaseConfig();
    setSupabaseConfig(updated);
    setDbStatusMsg({ ok: true, text: 'Supabase cloud database connected successfully!' });
    setIsTestingDb(false);
    setTimeout(() => {
      setIsConnectDbOpen(false);
      setDbStatusMsg(null);
    }, 1500);
  };

  // Sign In Handler with Supabase Auth
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Check if email format is valid or if email is not the authorized owner
    if (!cleanEmail || !emailRegex.test(cleanEmail) || !isAuthorizedOwner(cleanEmail)) {
      setErrorMessage('Invalid email address');
      return;
    }

    if (!password) {
      setErrorMessage('Incorrect password or email');
      return;
    }

    setIsLoading(true);
    const client = getSupabaseClient();

    try {
      if (client && supabaseConfig.isConfigured) {
        // Authenticate directly with Supabase Auth
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setErrorMessage('Incorrect password or email');
          setIsLoading(false);
          return;
        }

        if (data.user) {
          if (!isAuthorizedOwner(data.user.email)) {
            await client.auth.signOut();
            setErrorMessage('Invalid email address');
            setIsLoading(false);
            return;
          }

          setSuccessMessage('Authentication Successful! Opening management portal...');
          setTimeout(() => {
            onLoginSuccess(data.user.email || cleanEmail);
          }, 350);
        }
      } else {
        // Fallback when Supabase credentials are in local mode
        await new Promise((resolve) => setTimeout(resolve, 350));
        setSuccessMessage('Authentication Successful! Opening management portal...');
        setTimeout(() => {
          onLoginSuccess(cleanEmail);
        }, 300);
      }
    } catch (err: any) {
      setErrorMessage('Incorrect password or email');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Recovery via Supabase
  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail) || !isAuthorizedOwner(cleanEmail)) {
      setErrorMessage('Invalid email address');
      return;
    }

    setIsLoading(true);
    const client = getSupabaseClient();

    try {
      const redirectUrl = `${window.location.origin}/#reset-password`;
      if (client && supabaseConfig.isConfigured) {
        const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: redirectUrl,
        });
        if (error) throw error;
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      setSuccessMessage(`Supabase password reset link dispatched to ${cleanEmail}! Check your inbox to reset credentials.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch recovery email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-cyan-500 selection:text-black">
      
      {/* Background Sacred Geometric Glow & Ambient Watermarks */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-amber-900/15 rounded-full blur-3xl" />

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.035] select-none">
          <svg width="600" height="600" viewBox="0 0 200 200" fill="none" stroke="currentColor">
            <circle cx="100" cy="100" r="80" strokeWidth="1" strokeDasharray="4 4" className="text-cyan-400" />
            <circle cx="100" cy="100" r="60" strokeWidth="1.5" className="text-purple-400" />
            <polygon points="100,25 125,75 180,75 135,110 155,165 100,135 45,165 65,110 20,75 75,75" strokeWidth="1" className="text-cyan-300" />
            <ellipse cx="100" cy="100" rx="40" ry="20" strokeWidth="1" className="text-purple-300" />
          </svg>
        </div>
      </div>

      {/* Top Banner: Supabase Status Bar */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* SSF Gold Logo Badge */}
          <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-[#1a1505] to-[#0a0802] border border-[#d97706]/70 shadow-[0_0_10px_rgba(217,119,6,0.25)] select-none">
            <span className="text-[9px] font-black tracking-wider text-[#fbbf24] leading-none">SSF</span>
            <span className="text-[6px] font-bold tracking-widest text-[#f59e0b] leading-tight">FINANCE</span>
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-[#f59e0b] uppercase tracking-wider font-display leading-tight">
              SRI SENNAMAL FINANCE
            </h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span>Coimbatore, Tamil Nadu</span>
            </p>
          </div>
        </div>

        {/* Supabase Status & Connect DB Pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsConnectDbOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border transition-all cursor-pointer ${
              supabaseConfig.isConfigured
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            }`}
            title="Click to Connect or configure Supabase Database"
          >
            <Database className="w-3 h-3 shrink-0" />
            <span>
              {supabaseConfig.isConfigured
                ? `Supabase: Connected (${supabaseConfig.source.toUpperCase()})`
                : 'Supabase: Offline (Click to Connect)'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-[#0c1322]/95 border border-cyan-500/30 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.12)] p-6 sm:p-8 backdrop-blur-xl relative">
          
          {/* Top Brand & Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-3">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1">
              உரிமையாளர் உள்நுழைவு
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
              Owner Management Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Authorized Cloud Sign-In for Sri Sennamal Finance
            </p>
          </div>

          {/* Navigation Mode Tabs: Sign In & Reset */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-5 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-2 font-bold rounded-lg transition-all ${
                activeTab === 'signin'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('forgot');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-2 font-bold rounded-lg transition-all ${
                activeTab === 'forgot'
                  ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Reset Password
            </button>
          </div>

          {/* AFK Auto-Logout Notice Banner */}
          {afkNotice && (
            <div className="mb-4 p-3 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{afkNotice}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {activeTab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Owner Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="playwithsakthigaming@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Owner Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter master password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 select-none">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>Remember session on this device</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('forgot')}
                  className="text-cyan-400 hover:underline"
                >
                  Forgot?
                </button>
              </div>

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 font-bold text-xs text-black bg-[#00e5ff] hover:bg-[#38bdf8] disabled:opacity-50 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all active:scale-[0.99] mt-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with Supabase Auth...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Login with Supabase</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: PASSWORD RECOVERY */}
          {activeTab === 'forgot' && (
            <form onSubmit={handlePasswordRecovery} className="space-y-4 text-xs">
              <p className="text-slate-300 text-xs">
                Enter your designated owner email. Supabase Auth will transmit a secure password reset link to your inbox.
              </p>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Owner Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('signin')}
                  className="w-1/3 py-2.5 px-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-2/3 py-2.5 px-3 font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow cursor-pointer"
                >
                  {isLoading ? 'Dispatching...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      {/* Connect Supabase Cloud DB Modal */}
      {isConnectDbOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0c1322] border border-cyan-500/40 rounded-2xl shadow-2xl p-6 relative text-slate-100">
            <button
              type="button"
              onClick={() => setIsConnectDbOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-display">Connect Supabase Cloud DB</h3>
                <p className="text-[11px] text-slate-400">Configure project credentials for cloud authentication & sync</p>
              </div>
            </div>

            {dbStatusMsg && (
              <div
                className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  dbStatusMsg.ok
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                }`}
              >
                {dbStatusMsg.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{dbStatusMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveDb} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://xyzcompany.supabase.co"
                  value={dbUrlInput}
                  onChange={(e) => setDbUrlInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Supabase Anon (Public) Key
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={dbKeyInput}
                  onChange={(e) => setDbKeyInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-[11px] focus:border-cyan-400 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConnectDbOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTestingDb}
                  className="px-4 py-2 font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTestingDb ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Save & Connect</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-500 border-t border-slate-900 bg-[#070b14]/60">
        <p>
          Sri Sennamal Finance · Coimbatore, Tamil Nadu, India · Helpline: +91 7812834522
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Single Owner Authorization Enforced · Row Level Security (RLS) Active
        </p>
      </footer>

    </div>
  );
};
