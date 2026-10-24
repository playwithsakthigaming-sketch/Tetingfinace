/**
 * Sri Sennamal Finance — Top Navigation Header
 * Matches the user reference screenshot style:
 * Gold SSF logo badge, "SRI SENNAMAL FINANCE" in gold, "● Weekly Microfinance · Tamil Nadu, India",
 * Auto Save pill, [+ New Collection] cyan button, Administrator badge, and [⇄ Switch to Agent].
 */

import React from 'react';
import {
  Menu,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Plus,
  Repeat,
  LogOut,
} from 'lucide-react';
import { AutoSaveStatus } from '../services/financeStore';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  autoSaveStatus: AutoSaveStatus;
  ownerEmail: string | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenNewCollection: () => void;
  onToggleSidebar?: () => void;
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
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="w-full px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Left: Hamburger & Brand Lockup */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Hamburger Button */}
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-cyan-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* SSF FINANCE Gold Square Badge */}
            <div className="relative flex flex-col items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-b from-[#1a1505] to-[#0a0802] border border-[#d97706]/70 shadow-[0_0_12px_rgba(217,119,6,0.25)] select-none">
              <span className="text-[10px] sm:text-[11px] font-black tracking-wider text-[#fbbf24] leading-none">
                SSF
              </span>
              <span className="text-[6.5px] sm:text-[7.5px] font-bold tracking-widest text-[#f59e0b] leading-tight mt-0.5">
                FINANCE
              </span>
            </div>

            {/* Brand Title and Tagline */}
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold tracking-wider text-[#f59e0b] font-display uppercase leading-tight">
                SRI SENNAMAL FINANCE
              </span>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span className="text-[#a3e635]/90">Weekly Microfinance</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 hidden xs:inline">Tamil Nadu, India</span>
              </div>
            </div>
          </div>

          {/* Right Controls: Auto Save Pill, [+ New Collection], Admin Badge, Switch to Agent, Logout */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Auto Save Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border border-cyan-500/40 bg-cyan-950/30 text-cyan-300">
              {autoSaveStatus === 'saving' && (
                <>
                  <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                  <span>Auto Save: Saving...</span>
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>Auto Save: Saved</span>
                </>
              )}
              {autoSaveStatus === 'error' && (
                <>
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span className="text-rose-300">Auto Save: Failed</span>
                </>
              )}
              {autoSaveStatus === 'idle' && (
                <>
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>Auto Save: Saved</span>
                </>
              )}
            </div>

            {/* [+ New Collection] Bright Cyan Button */}
            <button
              onClick={onOpenNewCollection}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-black bg-[#00e5ff] hover:bg-[#38bdf8] rounded-lg shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all whitespace-nowrap active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">New Collection</span>
              <span className="sm:hidden">Collection</span>
            </button>

            {/* Profile Avatar Badge */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="w-6 h-6 rounded-full bg-purple-900/80 border border-purple-500/40 text-purple-200 flex items-center justify-center font-bold text-xs">
                M
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[11px] font-semibold text-slate-200">M..</span>
                <span className="text-[9px] text-slate-400">Administrator</span>
              </div>
            </div>

            {/* [⇄ Switch to Agent] Button */}
            <button
              onClick={() => onSelectTab('collections')}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/30 rounded-lg transition-colors whitespace-nowrap"
              title="Quick switch to collection desk"
            >
              <Repeat className="w-3.5 h-3.5 text-cyan-400" />
              <span>Switch to Agent</span>
            </button>

            {/* Logout / Exit Icon Button */}
            <button
              onClick={ownerEmail ? onLogout : onOpenLogin}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
              title={ownerEmail ? 'Logout Owner' : 'Owner Login'}
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
