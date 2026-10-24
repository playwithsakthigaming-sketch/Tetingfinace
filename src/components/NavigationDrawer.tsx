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
import { UserProfile } from '../types/finance';

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
  userProfile?: UserProfile;
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
  userProfile,
}) => {
  if (!isOpen) return null;

  const currentProfile = userProfile || userService.getProfileByEmail(ownerEmail);

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

  const userRole = currentProfile.role;
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isAgent = userRole === 'collection_team';

  // 1. Core Collection Desk Operations (Open to all roles)
  const coreLinks = [
    { id: 'collections', label: 'Single Payment Collection', icon: Receipt },
    { id: 'multiple_due', label: 'Multiple Due Entry', icon: Coins },
    { id: 'dashboard', label: 'Financial Dashboard', icon: LayoutGrid },
    { id: 'loans', label: 'Active Loan Book', icon: FileText },
    { id: 'customers', label: 'Customer Registry', icon: Users },
  ];

  // 2. Manager & Administrator Auditing & Records
  const managementLinks = [
    { id: 'refunds', label: 'Refunds & Reversals', icon: RotateCcw, allowed: !isAgent, tag: 'Manager+' },
    { id: 'ledger', label: 'Customer Ledger', icon: BookOpen, allowed: !isAgent, tag: 'Manager+' },
    { id: 'reports', label: 'Collections & Reports', icon: BarChart3, allowed: !isAgent, tag: 'Manager+' },
  ];

  // 3. Administrator System Control
  const adminLinks = [
    { id: 'autosave', label: 'Auto Save & Recovery', icon: Cloud, allowed: isAdmin, tag: 'Admin' },
    { id: 'settings', label: 'Settings & Licencing', icon: Settings, allowed: isAdmin, tag: 'Admin' },
    { id: 'tests', label: '24 Automated Tests', icon: ShieldCheck, allowed: isAdmin, tag: 'Admin' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Body */}
      <div className="relative w-80 max-w-[88vw] h-full bg-[#060c18] border-r border-cyan-950/70 shadow-2xl p-4 sm:p-5 flex flex-col justify-between z-10 overflow-hidden">
        
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
                <span className="text-[10px] text-slate-400">
                  {isAgent ? 'Collection Agent Mode (வசூல்)' : isManager ? 'Branch Manager Mode' : 'Admin Control'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links Grouped by Permissions */}
          <div className="mt-3 space-y-3 overflow-y-auto flex-1 pr-1">
            
            {/* Section 1: Field Operations & Collections Desk */}
            <div>
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-cyan-400/90 font-bold px-2 block mb-1">
                Field Operations (களப்பணி & வசூல்)
              </span>
              <div className="space-y-1">
                {coreLinks.map((item) => {
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
              </div>
            </div>

            {/* Section 2: Management & Financial Audits */}
            <div>
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-amber-400/90 font-bold px-2 block mb-1">
                Management & Records (மேலாண்மை)
              </span>
              <div className="space-y-1">
                {managementLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  if (!item.allowed) {
                    return (
                      <div
                        key={item.id}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-slate-500 bg-slate-950/30 border border-slate-900/80 cursor-not-allowed opacity-60"
                        title="Restricted: Requires Manager or Administrator account"
                      >
                        <div className="flex items-center gap-3">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {item.tag}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/60 text-[#00e5ff] border border-cyan-500/30 font-semibold shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                          : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#00e5ff]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: System Administration (Admin Only) */}
            <div>
              <span className="text-[9.5px] font-mono uppercase tracking-wider text-purple-400/90 font-bold px-2 block mb-1">
                System Administration (நிர்வாகம்)
              </span>
              <div className="space-y-1">
                {adminLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  if (!item.allowed) {
                    return (
                      <div
                        key={item.id}
                        className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs text-slate-500 bg-slate-950/30 border border-slate-900/80 cursor-not-allowed opacity-60"
                        title="Restricted: Requires Administrator account"
                      >
                        <div className="flex items-center gap-3">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                          Admin Only
                        </span>
                      </div>
                    );
                  }
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/60 text-[#00e5ff] border border-cyan-500/30 font-semibold shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                          : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-[#00e5ff]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear Database (Strictly Admin Only) */}
            {onOpenClearData && isAdmin && (
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
