/**
 * Sri Sennamal Finance — Navigation Drawer
 * Slides out from left when clicking hamburger menu or bottom "Menu" button.
 * Bottom section strictly matches Image 2 reference:
 * SSF gold badge, "SRI SENNAMAL FINANCE", address subtitle, and the "Admin Mode / Master Access Active / Exit" card.
 */

import React from 'react';
import {
  X,
  LayoutGrid,
  Users,
  FileText,
  Coins,
  Receipt,
  RotateCcw,
  BookOpen,
  BarChart3,
  Cloud,
  ShieldCheck,
  Settings,
  Lock,
} from 'lucide-react';
import { userService } from '../services/userService';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  ownerEmail: string | null;
  businessAddress?: string;
  onOpenClearData?: () => void;
  onLogout?: () => void;
  onOpenProfile?: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  ownerEmail,
  businessAddress = '45 Bazaar Street, Salem, Tamil Nadu, ...',
  onOpenClearData,
  onLogout,
  onOpenProfile,
}) => {
  if (!isOpen) return null;

  const currentProfile = userService.getProfileByEmail(ownerEmail);

  // Role mode text and initial matching Image 2
  const modeTitle = currentProfile.role === 'admin'
    ? 'Admin Mode'
    : currentProfile.role === 'manager'
    ? 'Manager Mode'
    : 'Collection Mode';

  const modeSubtitle = currentProfile.role === 'admin'
    ? 'Master Access Active'
    : currentProfile.role === 'manager'
    ? 'Manager Access Active'
    : 'Field Agent Active';

  const initialBadge = currentProfile.role === 'admin'
    ? 'A'
    : currentProfile.role === 'manager'
    ? 'M'
    : 'C';

  const links = [
    { id: 'dashboard', label: 'Financial Dashboard', icon: LayoutGrid },
    { id: 'loans', label: 'Active Loan Book', icon: FileText },
    { id: 'customers', label: 'Customer Registry', icon: Users },
    { id: 'multiple_due', label: 'Multiple Due Entry', icon: Coins },
    { id: 'collections', label: 'Single Payment Collection', icon: Receipt },
    { id: 'refunds', label: 'Refunds & Reversals', icon: RotateCcw },
    { id: 'ledger', label: 'Customer Ledger', icon: BookOpen },
    { id: 'reports', label: 'Collections & Reports', icon: BarChart3 },
    { id: 'autosave', label: 'Auto Save & Restore', icon: Cloud },
    { id: 'tests', label: '24 Automated Tests', icon: ShieldCheck },
    { id: 'settings', label: 'Settings & Licencing', icon: Settings },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-76 max-w-[85vw] h-full bg-[#060c18] border-r border-cyan-950/70 shadow-2xl p-4 sm:p-5 flex flex-col justify-between z-10 overflow-hidden">
        
        {/* Top Header & Links */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0c1a14] border border-[#d4af37] flex flex-col items-center justify-center shadow-[0_0_8px_rgba(212,175,55,0.3)]">
                <span className="text-[6px] text-[#fbbf24] leading-none">★</span>
                <span className="text-[9px] font-black text-[#fbbf24] leading-none font-serif">SSF</span>
                <span className="text-[5px] text-[#d4af37] leading-none">★</span>
              </div>
              <div>
                <span className="text-xs font-serif font-black text-white uppercase block tracking-wider">
                  Sri Sennamal Finance
                </span>
                <span className="text-[10px] text-slate-400">Coimbatore Central</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="mt-3 space-y-1 overflow-y-auto flex-1 pr-1">
            {links.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-cyan-950/60 text-[#00e5ff] border border-cyan-500/30 font-semibold shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                      : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00e5ff]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {onOpenClearData && (
              <div className="pt-2 border-t border-slate-800/80 mt-2">
                <button
                  onClick={() => {
                    onClose();
                    onOpenClearData();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-500/20 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Clear All Data (Reset)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* BOTTOM SECTION: EXACT MATCH TO IMAGE 2 (sidebar la keta add pannu) */}
        {/* ======================================================== */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2.5 shrink-0 bg-[#060c18]">
          
          {/* 1. SSF Logo & Business Address block (Matches Image 2) */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-7 h-7 rounded-lg bg-[#0c1a14] border border-[#d4af37] flex flex-col items-center justify-center shrink-0 shadow-[0_0_8px_rgba(212,175,55,0.35)] select-none">
              <span className="text-[5.5px] text-[#fbbf24] leading-none">★</span>
              <span className="text-[8.5px] font-black text-[#fbbf24] leading-none font-serif">SSF</span>
              <span className="text-[4.5px] text-[#d4af37] leading-none">★</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11.5px] font-serif font-black text-white block uppercase tracking-wide truncate">
                SRI SENNAMAL FINANCE
              </span>
              <span className="text-[9.5px] text-slate-400 font-sans block truncate max-w-[190px]">
                {businessAddress}
              </span>
            </div>
          </div>

          {/* 2. Admin Mode Card (Matches Image 2 exactly) */}
          <div className="rounded-2xl p-2.5 bg-[#3a352a]/40 border border-[#7d7363]/60 shadow-lg flex items-center justify-between gap-2">
            
            {/* Left Orange/Amber Badge with initial 'A' */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfile?.();
                }}
                className="w-8 h-8 rounded-xl bg-[#f59e0b] hover:bg-[#fbbf24] text-black font-black text-sm flex items-center justify-center shrink-0 shadow-sm cursor-pointer transition-transform hover:scale-105 select-none"
                title="Click to view User Profile"
              >
                {initialBadge}
              </button>

              {/* Mode Text & Status */}
              <div
                onClick={() => {
                  onClose();
                  onOpenProfile?.();
                }}
                className="min-w-0 cursor-pointer"
                title="Click to view User Profile"
              >
                <div className="text-xs font-bold text-white leading-tight truncate">
                  {modeTitle}
                </div>
                <div className="text-[10px] font-mono text-[#f59e0b] font-medium leading-tight mt-0.5 truncate">
                  {modeSubtitle}
                </div>
              </div>
            </div>

            {/* Right 'Exit' Link */}
            {onLogout && (
              <button
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="text-xs font-bold text-[#e08920] hover:text-[#fbbf24] underline hover:no-underline transition-colors cursor-pointer shrink-0 pr-1 select-none"
                title="Exit / Sign Out"
              >
                Exit
              </button>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
