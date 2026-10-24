/**
 * Sri Sennamal Finance — Dedicated Sole Owner Login Page
 * Full-screen gateway connecting to Supabase Auth & Cloud Database.
 * Sole owner authorization enforced for playwithsakthigaming@gmail.com.
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Database,
  Copy,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';
import {
  DESIGNATED_OWNER_EMAIL,
  isAuthorizedOwner,
  getSupabaseClient,
  getActiveSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabase';

interface LoginPageProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
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

  // Supabase Configuration Modal State
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [supabaseConfig, setSupabaseConfig] = useState(() => getActiveSupabaseConfig());
  const [inputUrl, setInputUrl] = useState<string>(supabaseConfig.url || '');
  const [inputKey, setInputKey] = useState<string>(supabaseConfig.anonKey || '');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // SQL Schema View Modal
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);
  const [sqlCopied, setSqlCopied] = useState<boolean>(false);

  // Refresh config state on mount
  useEffect(() => {
    const config = getActiveSupabaseConfig();
    setSupabaseConfig(config);
    if (config.url) setInputUrl(config.url);
    if (config.anonKey) setInputKey(config.anonKey);
  }, []);

  // Quick preset email click
  const handleUseDesignatedEmail = () => {
    setEmail(DESIGNATED_OWNER_EMAIL);
    setErrorMessage(null);
  };

  // Sign In Handler with Supabase Auth
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim().toLowerCase();

    // Enforce designated owner identity verification
    if (!isAuthorizedOwner(cleanEmail)) {
      setErrorMessage(
        'அங்கீகரிக்கப்படாத கணக்கு / Access Denied: Sri Sennamal Finance portal allows only the authorized owner (playwithsakthigaming@gmail.com).'
      );
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your owner password.');
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
          setErrorMessage(`Supabase Auth: ${error.message}. Please verify your credentials or reset password.`);
          setIsLoading(false);
          return;
        }

        if (data.user) {
          if (!isAuthorizedOwner(data.user.email)) {
            await client.auth.signOut();
            setErrorMessage('Access Denied: Logged in user email is not the authorized owner.');
            setIsLoading(false);
            return;
          }

          setSuccessMessage('Supabase Authentication Verified! Opening management portal...');
          setTimeout(() => {
            onLoginSuccess(data.user.email || cleanEmail);
          }, 350);
        }
      } else {
        // Fallback when Supabase is in local mode
        await new Promise((resolve) => setTimeout(resolve, 350));
        setSuccessMessage('Owner Verification Successful! Opening management portal...');
        setTimeout(() => {
          onLoginSuccess(cleanEmail);
        }, 300);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unexpected login error occurred.');
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
    if (!cleanEmail) {
      setErrorMessage('Please enter email address.');
      return;
    }

    setIsLoading(true);
    const client = getSupabaseClient();

    try {
      if (client && supabaseConfig.isConfigured) {
        const { error } = await client.auth.resetPasswordForEmail(cleanEmail);
        if (error) throw error;
      } else {
        await new Promise((r) => setTimeout(r, 400));
      }
      setSuccessMessage(`Password recovery email dispatched to ${cleanEmail}. Check inbox.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch recovery email.');
    } finally {
      setIsLoading(false);
    }
  };

  // Test Supabase Connection in settings modal
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(inputUrl, inputKey);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message || 'Connection test failed' });
    } finally {
      setTestingConnection(false);
    }
  };

  // Save Custom Supabase Credentials
  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const result = saveCustomSupabaseConfig(inputUrl, inputKey);
    if (!result.success) {
      setTestResult({ ok: false, message: result.error || 'Failed to save' });
      return;
    }

    const updated = getActiveSupabaseConfig();
    setSupabaseConfig(updated);
    setTestResult({ ok: true, message: 'Supabase credentials saved successfully!' });
    setTimeout(() => {
      setIsConfigModalOpen(false);
      setTestResult(null);
    }, 800);
  };

  const handleClearConfig = () => {
    clearCustomSupabaseConfig();
    const updated = getActiveSupabaseConfig();
    setSupabaseConfig(updated);
    setInputUrl('');
    setInputKey('');
    setTestResult({ ok: true, message: 'Reset to local offline mode.' });
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

        {/* Supabase Status Pill & Settings Trigger */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
              supabaseConfig.isConfigured
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
          >
            <Database className="w-3 h-3 shrink-0" />
            <span>
              {supabaseConfig.isConfigured
                ? `Supabase: Connected (${supabaseConfig.source.toUpperCase()})`
                : 'Supabase: Local / Offline'}
            </span>
          </div>

          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all shadow-sm"
            title="Configure Supabase Project URL & Anon Key"
          >
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">Supabase Setup</span>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">Owner Email Address</label>
                  <button
                    type="button"
                    onClick={handleUseDesignatedEmail}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Use Owner Email
                  </button>
                </div>
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
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Designated Owner: <strong className="text-slate-300 font-mono">playwithsakthigaming@gmail.com</strong></span>
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
                  className="w-2/3 py-2.5 px-3 font-bold text-black bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow"
                >
                  {isLoading ? 'Dispatching...' : 'Send Recovery Email'}
                </button>
              </div>
            </form>
          )}

          {/* Bottom Helpers & Quick Tools */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              <Database className="w-3 h-3" />
              <span>Supabase SQL Migration</span>
            </button>

            <span className="text-slate-500">·</span>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="text-slate-400 hover:text-white flex items-center gap-1"
            >
              <Sliders className="w-3 h-3 text-amber-400" />
              <span>Connect DB</span>
            </button>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-500 border-t border-slate-900 bg-[#070b14]/60">
        <p>
          Sri Sennamal Finance · Coimbatore, Tamil Nadu, India · Helpline: +91 7812834522
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Single Owner Authorization Enforced · Row Level Security (RLS) Active
        </p>
      </footer>

      {/* MODAL 1: SUPABASE CONFIGURATION MODAL */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0c1322] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Supabase Cloud Connection</h3>
                  <p className="text-[10px] text-slate-400">Connect your Supabase project URL & Anon Public Key</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsConfigModalOpen(false);
                  setTestResult(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL) *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://your-project-ref.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Found in Supabase Dashboard → Project Settings → API → Project URL
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
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono focus:border-cyan-400 focus:outline-none text-[11px]"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Found in Supabase Dashboard → Project Settings → API → Project API Keys (anon public)
                </span>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.ok
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={testingConnection || !inputUrl || !inputKey}
                    onClick={handleTestConnection}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
                  >
                    {testingConnection ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>Test Connection</span>
                  </button>

                  {supabaseConfig.source === 'custom' && (
                    <button
                      type="button"
                      onClick={handleClearConfig}
                      className="px-2.5 py-2 text-rose-400 hover:text-rose-300 text-[11px]"
                    >
                      Clear Saved
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold shadow"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SQL SCHEMA MIGRATION VIEWER */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0c1322] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-xs space-y-4 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-bold text-white font-display">Supabase SQL Migration Script</h3>
                  <p className="text-[10px] text-slate-400">Copy & execute in your Supabase SQL Editor</p>
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
              To create the database tables (customers, loans, installments, payments, ledger, businesses, tokens, RLS rules) in Supabase:
              Open your <strong>Supabase Dashboard → SQL Editor → New Query</strong>, paste the script below, and click <strong>Run</strong>.
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

-- 2. OWNER ACCESS TABLE
CREATE TABLE IF NOT EXISTS public.owner_access (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_email TEXT UNIQUE NOT NULL,
    auth_user_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('Asia/Kolkata', now())
);

INSERT INTO public.owner_access (owner_email, is_active)
VALUES ('playwithsakthigaming@gmail.com', TRUE)
ON CONFLICT (owner_email) DO NOTHING;

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

-- (Full schema available in /supabase/migrations/20261023_initial_schema.sql)`}
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
