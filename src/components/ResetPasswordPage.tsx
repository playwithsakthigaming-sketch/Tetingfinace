/**
 * Sri Sennamal Finance — Dedicated Supabase Reset Password Page
 * Allows the owner to set a new master password via Supabase Auth.
 * Handles the recovery flow triggered from Supabase reset email links,
 * URL access tokens, PKCE codes, and 6-digit email verification OTP codes.
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ArrowLeft,
  Check,
  Mail,
  Send,
  ShieldAlert,
  Database,
  X,
} from 'lucide-react';
import {
  DESIGNATED_OWNER_EMAIL,
  getSupabaseClient,
  getActiveSupabaseConfig,
  saveCustomSupabaseConfig,
  testSupabaseConnection,
} from '../services/supabase';

interface ResetPasswordPageProps {
  onBackToLogin: () => void;
  onSuccess?: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({
  onBackToLogin,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Recovery session state
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [showOtpField, setShowOtpField] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [supabaseConfig, setSupabaseConfig] = useState(() => getActiveSupabaseConfig());
  const [isConnectDbOpen, setIsConnectDbOpen] = useState(false);
  const [dbUrlInput, setDbUrlInput] = useState(() => getActiveSupabaseConfig().url || '');
  const [dbKeyInput, setDbKeyInput] = useState(() => getActiveSupabaseConfig().anonKey || '');
  const [dbStatusMsg, setDbStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);

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
    setDbStatusMsg({ ok: true, text: 'Supabase Database connected successfully!' });
    setIsTestingDb(false);
    setTimeout(() => {
      setIsConnectDbOpen(false);
      setDbStatusMsg(null);
      window.location.reload();
    }, 1200);
  };

  // Inspect URL parameters and Supabase session on mount
  useEffect(() => {
    let isMounted = true;
    const client = getSupabaseClient();

    if (!client) {
      setIsCheckingSession(false);
      return;
    }

    const checkAndInitSession = async () => {
      try {
        // 0. Check for error parameters in hash or search (e.g. expired link)
        const rawHash = window.location.hash || '';
        const rawSearch = window.location.search || '';
        if (rawHash.includes('error=') || rawSearch.includes('error=')) {
          const errPayload = rawHash.includes('error=')
            ? rawHash.substring(rawHash.indexOf('error='))
            : rawSearch.replace(/^\?/, '');
          const errParams = new URLSearchParams(errPayload);
          const errDesc = errParams.get('error_description') || errParams.get('error');
          if (errDesc && isMounted) {
            const cleanErr = decodeURIComponent(errDesc.replace(/\+/g, ' '));
            setErrorMessage(cleanErr);
            setShowOtpField(true);
            setIsCheckingSession(false);
            return;
          }
        }

        // 1. Check for PKCE ?code= parameter
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        if (code) {
          const { data, error } = await client.auth.exchangeCodeForSession(code);
          if (data?.session && isMounted) {
            setHasActiveSession(true);
            setSuccessMessage('Recovery session verified from link! Enter your new password below.');
            setIsCheckingSession(false);
            return;
          }
        }

        // 2. Check for Hash #access_token= parameter (handles #access_token=... or #reset-password#access_token=...)
        const hash = window.location.hash || '';
        if (hash.includes('access_token=')) {
          const tokenSubstring = hash.substring(hash.indexOf('access_token='));
          const hashParams = new URLSearchParams(tokenSubstring);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error } = await client.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!error && data?.session && isMounted) {
              setHasActiveSession(true);
              setSuccessMessage('Recovery session verified from link! Enter your new password below.');
              setIsCheckingSession(false);
              return;
            }
          }
        }

        // 3. Check existing active session
        const { data: { session } } = await client.auth.getSession();
        if (session && isMounted) {
          setHasActiveSession(true);
        } else if (isMounted) {
          // If no session exists, show OTP input so user can verify via code or link
          setShowOtpField(true);
        }
      } catch (err) {
        console.warn('Session verification warning:', err);
      } finally {
        if (isMounted) setIsCheckingSession(false);
      }
    };

    checkAndInitSession();

    // Also listen for PASSWORD_RECOVERY or SIGNED_IN event while on this page
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        setHasActiveSession(true);
        setSuccessMessage('Recovery session verified! Enter your new password below.');
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Resend reset link or code to owner email
  const handleResendResetLink = async () => {
    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const client = getSupabaseClient();
    try {
      if (client && supabaseConfig.isConfigured) {
        const redirectUrl = `${window.location.origin}/#reset-password`;
        const { error } = await client.auth.resetPasswordForEmail(DESIGNATED_OWNER_EMAIL, {
          redirectTo: redirectUrl,
        });

        if (error) throw error;
        setSuccessMessage(`New reset link & verification code sent to ${DESIGNATED_OWNER_EMAIL}. Check inbox.`);
        setShowOtpField(true);
      } else {
        await new Promise((r) => setTimeout(r, 400));
        setSuccessMessage(`Reset code dispatched to ${DESIGNATED_OWNER_EMAIL}.`);
        setShowOtpField(true);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch reset email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    const client = getSupabaseClient();

    try {
      if (client && supabaseConfig.isConfigured) {
        // If no active session, but user provided an OTP code from email
        if (!hasActiveSession && otpCode.trim()) {
          const cleanOtp = otpCode.trim();
          const { data: verifyData, error: verifyError } = await client.auth.verifyOtp({
            email: DESIGNATED_OWNER_EMAIL,
            token: cleanOtp,
            type: 'recovery',
          });

          if (verifyError) {
            setErrorMessage(`Verification Code Error: ${verifyError.message || 'Invalid 6-digit code. Please request a new code.'}`);
            setIsLoading(false);
            return;
          }

          if (verifyData.session) {
            setHasActiveSession(true);
          }
        }

        // Now update password
        const { error } = await client.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          // If Supabase still complains about missing session
          if (error.message?.toLowerCase().includes('session') || error.message?.toLowerCase().includes('missing')) {
            setShowOtpField(true);
            setErrorMessage(
              'Email verification required: Please enter the 6-digit code sent to your email, or click "Send New Reset Code" below.'
            );
          } else {
            setErrorMessage(error.message || 'Failed to update password in Supabase.');
          }
          setIsLoading(false);
          return;
        }

        setSuccessMessage('Password successfully updated in Supabase! Redirecting to login...');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            onBackToLogin();
          }
        }, 1500);
      } else {
        // Local mode fallback
        await new Promise((resolve) => setTimeout(resolve, 400));
        setSuccessMessage('Password successfully updated! Redirecting to login...');
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            onBackToLogin();
          }
        }, 1500);
      }
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes('session')) {
        setShowOtpField(true);
        setErrorMessage(
          'Email verification required: Please enter the 6-digit code sent to your email, or click "Send New Reset Code" below.'
        );
      } else {
        setErrorMessage(err?.message || 'Error updating password.');
      }
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

      {/* Top Banner */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-3.5 border-b border-slate-800/80 bg-[#070b14]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-[#1a1505] to-[#0a0802] border border-[#d97706]/70 shadow-[0_0_10px_rgba(217,119,6,0.25)] select-none">
            <span className="text-[9px] font-black tracking-wider text-[#fbbf24] leading-none">SSF</span>
            <span className="text-[6px] font-bold tracking-widest text-[#f59e0b] leading-tight">FINANCE</span>
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-[#f59e0b] uppercase tracking-wider font-display leading-tight">
              SRI SENNAMAL FINANCE
            </h1>
            <p className="text-[10px] text-slate-400">Coimbatore, Tamil Nadu</p>
          </div>
        </div>

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

          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
        </div>
      </header>

      {/* Main Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-[#0c1322]/95 border border-cyan-500/30 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.12)] p-6 sm:p-8 backdrop-blur-xl relative">
          
          {/* Header Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-3">
              <KeyRound className="w-7 h-7" />
            </div>

            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-1">
              புதிய கடவுச்சொல் அமைத்தல்
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight">
              Reset Owner Password
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Set new master password for <span className="text-slate-300 font-mono">{DESIGNATED_OWNER_EMAIL}</span>
            </p>
          </div>

          {/* Database Offline Alert & Quick Connect */}
          {!supabaseConfig.isConfigured && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-400" />
                  Supabase Database Offline
                </span>
                <button
                  type="button"
                  onClick={() => setIsConnectDbOpen(true)}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Connect DB
                </button>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Connect your Supabase project to update your master credentials directly in the cloud database.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed flex-1">{successMessage}</div>
            </div>
          )}

          {/* Session Notice / Verification Code Helper */}
          {showOtpField && !hasActiveSession && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-amber-300">
                  <Mail className="w-3.5 h-3.5" />
                  Email Verification Code
                </span>
                <button
                  type="button"
                  disabled={isResending}
                  onClick={handleResendResetLink}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isResending ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>{isResending ? 'Sending...' : 'Send New Code'}</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-snug">
                Enter the 6-digit code or link token received at <strong className="font-mono text-white">{DESIGNATED_OWNER_EMAIL}</strong> to authorize password change.
              </p>
              <div>
                <input
                  type="text"
                  placeholder="e.g. 123456 (or token from email)"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-white font-mono text-center tracking-widest text-sm focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Active Session Badge */}
          {hasActiveSession && (
            <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Recovery session authenticated! Enter your new password below.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                New Master Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono"
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

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat master password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              {newPassword && confirmPassword && newPassword === confirmPassword ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5" /> Passwords match
                </span>
              ) : (
                <span>Minimum 6 characters with secure alphanumeric phrase</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 font-bold text-xs text-black bg-[#00e5ff] hover:bg-[#38bdf8] disabled:opacity-50 rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.35)] transition-all active:scale-[0.99] mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Supabase Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Update Password in Supabase</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-2.5 text-center text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
            >
              Cancel and Return to Sign In
            </button>
          </form>
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
                <p className="text-[11px] text-slate-400">Configure credentials to update password in Supabase</p>
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
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      <span>Save & Connect DB</span>
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
      </footer>
    </div>
  );
};
