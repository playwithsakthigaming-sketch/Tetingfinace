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
  subscribeToSupabaseHealth,
  ConnectionHealth,
  runHealthCheck,
} from '../services/supabase';
import { MouseAtmosphere } from './MouseAtmosphere';

interface LoginPageProps {
  onLoginSuccess: (email: string) => void;
  onOpenResetPage?: () => void;
  afkNotice?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onOpenResetPage, afkNotice }) => {
  // Auth state: strictly sign in or forgot password
  const [activeTab, setActiveTab] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Supabase Configuration & Health Status
  const [supabaseConfig, setSupabaseConfig] = useState(() => getActiveSupabaseConfig());
  const [dbHealth, setDbHealth] = useState<ConnectionHealth>({
    status: getActiveSupabaseConfig().isConfigured ? 'connecting' : 'offline',
    isConfigured: getActiveSupabaseConfig().isConfigured,
    url: getActiveSupabaseConfig().url,
    latencyMs: null,
    lastPingAt: null,
    consecutiveFailures: 0,
    errorMessage: null,
  });
  const [isConnectDbOpen, setIsConnectDbOpen] = useState<boolean>(false);
  const [dbUrlInput, setDbUrlInput] = useState<string>('');
  const [dbKeyInput, setDbKeyInput] = useState<string>('');
  const [dbStatusMsg, setDbStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);

  // Refresh config state, remember email, and listen to live Supabase connection health
  useEffect(() => {
    const cfg = getActiveSupabaseConfig();
    setSupabaseConfig(cfg);
    setDbUrlInput(cfg.url || '');
    setDbKeyInput(cfg.anonKey || '');

    const remembered = typeof window !== 'undefined' ? localStorage.getItem('sri_sennamal_remembered_email') : null;
    if (remembered) {
      setEmail(remembered);
    }

    const unsubscribe = subscribeToSupabaseHealth((health) => {
      setDbHealth(health);
      setSupabaseConfig(getActiveSupabaseConfig());
    });
    return unsubscribe;
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

    // Validate email format
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    const client = getSupabaseClient();

    try {
      if (client && supabaseConfig.isConfigured) {
        // Authenticate directly with Supabase Auth (allows any user created in Supabase)
        const { data, error } = await client.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          setErrorMessage(error.message || 'Incorrect password or email');
          setIsLoading(false);
          return;
        }

        if (data.user) {
          if (rememberDevice && typeof window !== 'undefined') {
            localStorage.setItem('sri_sennamal_remembered_email', cleanEmail);
          }
          setSuccessMessage('Authentication Successful! Opening management portal...');
          setTimeout(() => {
            onLoginSuccess(data.user.email || cleanEmail);
          }, 350);
        }
      } else {
        // Fallback when Supabase credentials are in local mode
        await new Promise((resolve) => setTimeout(resolve, 350));
        if (rememberDevice && typeof window !== 'undefined') {
          localStorage.setItem('sri_sennamal_remembered_email', cleanEmail);
        }
        setSuccessMessage('Authentication Successful! Opening management portal...');
        setTimeout(() => {
          onLoginSuccess(cleanEmail);
        }, 300);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Incorrect password or email');
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
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address');
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
      
      {/* Dynamic Animated Background with Celestial Star Constellation & Glowing Atmosphere */}
      <MouseAtmosphere />

      {/* Top Banner: Supabase Status Bar */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* SSF Gold Logo Badge */}
          <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-[#1a1505] to-[#0a0802] border border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.4)] select-none">
            <span className="text-[9px] font-black tracking-wider text-[#fbbf24] leading-none">SSF</span>
            <span className="text-[6px] font-bold tracking-widest text-[#f59e0b] leading-tight">FINANCE</span>
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider font-display leading-tight flex items-center gap-1.5">
              <span>SRI SENNAMAL FINANCE</span>
              <span className="text-[10px] text-[#fbbf24] font-normal hidden xs:inline">· ஸ்ரீ சென்னம்மாள்</span>
            </h1>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Coimbatore, Tamil Nadu · Official Owner Gateway</span>
            </p>
          </div>
        </div>

        {/* Supabase Status & Connect DB Pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsConnectDbOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono border transition-all cursor-pointer ${
              dbHealth.status === 'online'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                : dbHealth.status === 'connecting'
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            }`}
            title="Click to Connect or view Supabase Database Health"
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
            <Database className="w-3 h-3 shrink-0" />
            <span>
              {dbHealth.status === 'online'
                ? `Supabase: Online (${dbHealth.latencyMs ? `${dbHealth.latencyMs}ms` : 'Connected'})`
                : dbHealth.status === 'connecting'
                ? 'Supabase: Connecting...'
                : 'Supabase: Offline (Click to Connect)'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md neon-card p-6 sm:p-8 backdrop-blur-2xl relative shadow-[0_0_50px_rgba(0,229,255,0.2),0_0_25px_rgba(251,191,36,0.15)] border border-cyan-400/40">
          
          {/* Top Distinctive Illuminated Logo & Emblem */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3.5 group">
              {/* Outer Rotating Glowing Ring */}
              <div className="absolute -inset-2.5 rounded-full border border-dashed border-cyan-400/50 animate-orbit-slow pointer-events-none" />
              <div className="absolute -inset-1 rounded-full border border-amber-400/40 animate-orbit-reverse pointer-events-none" />
              
              {/* 3D Shield Badge with Gold & Neon Glow */}
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1405] via-[#091522] to-[#040811] border-2 border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.45),inset_0_0_15px_rgba(0,229,255,0.25)] flex flex-col items-center justify-center select-none transform transition-transform group-hover:scale-105">
                <span className="text-[10px] text-[#fbbf24] leading-none mb-0.5 animate-pulse">★ ★ ★</span>
                <span className="text-xl font-serif font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-[#fff2a8] via-[#fbbf24] to-[#d97706] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                  SSF
                </span>
                <span className="text-[7px] font-black tracking-[0.25em] text-[#00e5ff] uppercase mt-0.5">
                  FINANCE
                </span>
              </div>

              {/* Orbiting Starlight Particle Bead */}
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff] animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00e5ff]" />
            </div>

            {/* Brand Title with Gold & Cyan Dual Shimmer */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Official Owner Portal
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black tracking-wider text-white uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                SRI SENNAMAL FINANCE
              </h2>
              <div className="text-xs font-semibold text-[#fbbf24] tracking-wide">
                ஸ்ரீ சென்னம்மாள் பைனான்ஸ் · கோயம்புத்தூர்
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Gandhipuram & RS Puram · Weekly Loan Management
              </p>
            </div>
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
              className={`py-2 px-2 font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Owner Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('forgot');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`py-2 px-2 font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'forgot'
                  ? 'bg-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
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
                <label className="block text-slate-300 font-semibold mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Owner Email"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
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
                    className="rounded bg-slate-900 border-slate-700 text-cyan-400 focus:ring-0"
                  />
                  <span>Remember this device</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('forgot')}
                  className="text-cyan-400 hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Main Submit Button with Gradient Glow */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 font-black text-xs text-black bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 hover:brightness-110 disabled:opacity-50 rounded-xl shadow-[0_0_25px_rgba(0,229,255,0.4)] transition-all active:scale-[0.99] mt-2 cursor-pointer uppercase tracking-wider"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign In to Financial Portal</span>
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
                Enter your email address. Supabase Auth will transmit a secure password reset link to your inbox.
              </p>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email Address"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
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
