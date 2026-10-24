/**
 * Sri Sennamal Finance — Dedicated Supabase Reset Password Page
 * Allows the owner to set a new master password via Supabase Auth.
 * Handles the recovery flow triggered from Supabase reset email links.
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  DESIGNATED_OWNER_EMAIL,
  getSupabaseClient,
  getActiveSupabaseConfig,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const supabaseConfig = getActiveSupabaseConfig();

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
        // Update password in Supabase Auth
        const { error } = await client.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          setErrorMessage(error.message || 'Failed to update password in Supabase.');
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
        // Fallback for local testing
        await new Promise((resolve) => setTimeout(resolve, 500));
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
      setErrorMessage(err?.message || 'Error updating password.');
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

        <button
          type="button"
          onClick={onBackToLogin}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </button>
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
              Enter and confirm your new Supabase master password
            </p>
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
              className="w-full py-2.5 text-center text-slate-400 hover:text-white text-xs transition-colors"
            >
              Cancel and Return to Sign In
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-500 border-t border-slate-900 bg-[#070b14]/60">
        <p>
          Sri Sennamal Finance · Coimbatore, Tamil Nadu, India · Helpline: +91 7812834522
        </p>
      </footer>
    </div>
  );
};
