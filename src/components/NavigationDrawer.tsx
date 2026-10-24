/**
 * Sri Sennamal Finance — Navigation Drawer
 * Slides out from left when clicking hamburger menu or bottom "Menu" button.
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

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  ownerEmail: string | null;
  onOpenClearData?: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab,
  ownerEmail,
  onOpenClearData,
}) => {
  if (!isOpen) return null;

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
      <div className="relative w-72 max-w-[85vw] h-full bg-[#080e1b] border-r border-slate-800 shadow-2xl p-5 flex flex-col justify-between z-10">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-[#1a1505] to-[#0a0802] border border-[#d97706]/70 flex flex-col items-center justify-center">
                <span className="text-[9px] font-black text-[#fbbf24] leading-none">SSF</span>
                <span className="text-[6px] font-bold text-[#f59e0b] leading-none">FIN</span>
              </div>
              <div>
                <span className="text-xs font-bold text-[#f59e0b] uppercase block font-display tracking-wider">
                  Sri Sennamal Finance
                </span>
                <span className="text-[10px] text-slate-400">Coimbatore Central</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="mt-4 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-950/60 text-[#00e5ff] border border-cyan-500/30 font-semibold shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
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
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-500/20 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>Clear All Data (Reset)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate max-w-[150px]">{ownerEmail || 'Owner Active'}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">v1.0-TN</span>
        </div>
      </div>
    </div>
  );
};
