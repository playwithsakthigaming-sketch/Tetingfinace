/**
 * Sri Sennamal Finance — Top Navigation Header
 * Matches Image 1 reference style:
 * Gold/Dark SSF Badge, Serif "SRI SENNAMAL FINANCE", "● Weekly Microfinance · Tamil Nadu, India",
 * ☼ Theme toggle, ⊕ Pay vibrant cyan button, ⏱ Live IST Clock (ticking),
 * [EN | தமிழ்] Language Switcher, ● ADMIN Role Badge, Profile Avatar, and Logout.
 */

import React, { useState, useEffect } from 'react';
import {
  Menu,
  PlusCircle,
  Clock,
  Sun,
  LogOut,
  Database,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { AutoSaveStatus } from '../services/financeStore';
import { subscribeToSupabaseHealth, ConnectionHealth, getActiveSupabaseConfig } from '../services/supabase';
import { userService, subscribeToUserProfiles } from '../services/userService';
import { ROLE_LABELS, UserProfile } from '../types/finance';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  autoSaveStatus: AutoSaveStatus;
  ownerEmail: string | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenNewCollection: () => void;
  onToggleSidebar?: () => void;
  onOpenProfile?: () => void;
  userProfile?: UserProfile;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  autoSaveStatus,
  ownerEmail,
  onOpenLogin,
  onLogout,
  onOpenNewCollection,
  onToggleSidebar,
  onOpenProfile,
  userProfile: propUserProfile,
}) => {
  const [dbHealth, setDbHealth] = useState<ConnectionHealth>(() => ({
    status: getActiveSupabaseConfig().isConfigured ? 'connecting' : 'offline',
    isConfigured: getActiveSupabaseConfig().isConfigured,
    url: getActiveSupabaseConfig().url,
    latencyMs: null,
    lastPingAt: null,
    consecutiveFailures: 0,
    errorMessage: null,
  }));

  const [internalProfile, setInternalProfile] = useState<UserProfile>(() =>
    propUserProfile || userService.getProfileByEmail(ownerEmail)
  );

  useEffect(() => {
    if (propUserProfile) {
      setInternalProfile(propUserProfile);
    }
  }, [propUserProfile]);

  const activeProfile = propUserProfile || internalProfile;

  // Language Switch State: 'en' | 'ta'
  const [currentLang, setCurrentLang] = useState<'en' | 'ta'>('en');

  // Live IST Clock (Indian Standard Time) — Ticks every second
  const getISTFormatted = () => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(new Date()).toLowerCase();
    } catch (_) {
      return new Date().toLocaleTimeString('en-IN', { hour12: true }).toLowerCase();
    }
  };

  const [istTime, setIstTime] = useState<string>(getISTFormatted);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setIstTime(getISTFormatted());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    const unsubscribeDb = subscribeToSupabaseHealth((health) => {
      setDbHealth(health);
    });

    // Only subscribe to profile events if parent didn't supply userProfile
    let unsubscribeProfile: (() => void) | undefined;
    if (!propUserProfile) {
      unsubscribeProfile = subscribeToUserProfiles(() => {
        setInternalProfile(userService.getProfileByEmail(ownerEmail));
      });
    }

    return () => {
      unsubscribeDb();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [ownerEmail, propUserProfile]);

  // Role display label
  const roleName = activeProfile.role === 'admin'
    ? 'ADMIN'
    : activeProfile.role === 'manager'
    ? 'MANAGER'
    : 'AGENT';

  return (
    <header className="sticky top-0 z-40 bg-[#050a14]/98 backdrop-blur-md border-b border-cyan-950/60 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* ======================================================== */}
          {/* LEFT: Hamburger Menu + SSF Brand Lockup (Matches Image 1) */}
          {/* ======================================================== */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Hamburger Button for Mobile & Desktop Navigation */}
            <button
              onClick={onToggleSidebar}
              className="p-1 sm:p-1.5 text-cyan-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* SSF Gold/Dark Badge matching Image 1 */}
            <div className="relative shrink-0 flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#0c1a14] border border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.4)] select-none">
              <span className="text-[7px] sm:text-[8px] text-[#fbbf24] leading-none mb-0.5">★</span>
              <span className="text-[9px] sm:text-[11px] font-black tracking-wider text-[#fbbf24] leading-none font-serif">
                SSF
              </span>
              <span className="text-[5px] sm:text-[6.5px] font-bold tracking-widest text-[#d4af37] leading-none mt-0.5">
                ★
              </span>
            </div>

            {/* Brand Title (Serif White) & Subtitle (Green Dot + Amber Text) */}
            <div className="flex flex-col min-w-0 truncate">
              <span className="text-xs sm:text-base font-serif font-black tracking-wider text-white uppercase leading-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate">
                SRI SENNAMAL FINANCE
              </span>
              <div className="flex items-center gap-1.5 text-[9px] sm:text-[11px] font-medium leading-none mt-0.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse shrink-0" />
                <span className="text-[#f59e0b] truncate font-medium">
                  Weekly Microfinance · Tamil Nadu, India
                </span>
              </div>
            </div>

            {/* Light Sun Icon Toggle Button (Matches Image 1) */}
            <button
              type="button"
              onClick={() => {}}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-[#071322] border border-cyan-900/60 text-amber-300 hover:text-amber-200 hover:border-cyan-500/40 transition-colors shrink-0 cursor-pointer ml-1"
              title="Theme Toggle"
            >
              <Sun className="w-4 h-4" />
            </button>

            {/* ⊕ Pay Button (Vibrant Cyan Pill - Matches Image 1) */}
            <button
              onClick={onOpenNewCollection}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-1.5 rounded-full bg-[#00e5ff] hover:bg-[#38bdf8] text-black font-extrabold text-xs shadow-[0_0_16px_rgba(0,229,255,0.45)] transition-all active:scale-95 shrink-0 cursor-pointer ml-1"
              title="Collect Loan Due / Pay"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span className="tracking-wide">Pay</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* RIGHT: Live IST Clock + Language Toggle + Role Badge + Profile */}
          {/* ======================================================== */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Live IST Clock Pill (Matches Image 1: ⏱ IST 02:33:17 pm) */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#071322] border border-cyan-900/60 text-slate-300 font-mono text-[11px] select-none">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>IST {istTime}</span>
            </div>

            {/* Language Switcher Pill (Matches Image 1: [ EN | தமிழ் ]) */}
            <div className="flex items-center rounded-lg bg-[#071322] border border-cyan-900/60 p-0.5 text-[11px] font-semibold select-none">
              <button
                type="button"
                onClick={() => setCurrentLang('en')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  currentLang === 'en'
                    ? 'bg-cyan-950 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <span className="text-slate-600 px-0.5">|</span>
              <button
                type="button"
                onClick={() => setCurrentLang('ta')}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                  currentLang === 'ta'
                    ? 'bg-cyan-950 text-[#f59e0b] font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Role Badge (Matches Image 1: ● ADMIN in Gold/Amber pill) */}
            <button
              type="button"
              onClick={onOpenProfile}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#171206] border border-amber-600/70 text-[#fbbf24] hover:border-amber-400 font-mono text-[11px] font-bold tracking-wider cursor-pointer transition-colors shadow-[0_0_8px_rgba(245,158,11,0.2)]"
              title="Click to view/edit User Profile & Role"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
              <span>● {roleName}</span>
            </button>

            {/* Profile Avatar Button */}
            {onOpenProfile && (
              <button
                type="button"
                onClick={onOpenProfile}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-slate-900 border border-cyan-400/50 hover:border-cyan-300 flex items-center justify-center shrink-0 cursor-pointer transition-transform hover:scale-105"
                title="Open Profile Settings"
              >
                {activeProfile.avatarUrl ? (
                  <img
                    src={activeProfile.avatarUrl}
                    alt={activeProfile.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-cyan-300 uppercase">
                    {(activeProfile.displayName || activeProfile.email || 'U').charAt(0)}
                  </span>
                )}
              </button>
            )}

            {/* Exit / Logout Button */}
            <button
              onClick={ownerEmail ? onLogout : onOpenLogin}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
              title={ownerEmail ? 'Sign Out / Exit' : 'Login'}
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
