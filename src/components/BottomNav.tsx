/**
 * Sri Sennamal Finance — Bottom App Navigation Bar
 * Perfectly matches mobile bottom bar in reference screenshot:
 * Dashboard (grid), Collect (cyan circle with ₹), Customers (users), Loans (document), and Menu.
 */

import React from 'react';
import {
  LayoutGrid,
  Users,
  FileText,
  Menu,
} from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCollect: () => void;
  onOpenMenu: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCollect,
  onOpenMenu,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#070b14]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 sm:px-6 py-2 shadow-[0_-5px_25px_rgba(0,0,0,0.5)]">
      <div className="w-full max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between sm:justify-around">
        
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 px-3 sm:px-6 py-1 rounded-xl transition-all cursor-pointer ${
            currentTab === 'dashboard'
              ? 'text-[#00e5ff] bg-cyan-950/40 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <LayoutGrid className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-tight">Dashboard</span>
        </button>

        {/* Tab 2: Collect (Cyan circle with Indian Rupee symbol) */}
        <button
          onClick={onOpenCollect}
          className="flex flex-col items-center -mt-6 group cursor-pointer"
        >
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#00e5ff] hover:bg-[#38bdf8] text-black flex items-center justify-center font-black text-xl sm:text-2xl shadow-[0_0_25px_rgba(0,229,255,0.6)] group-hover:scale-105 transition-all">
            ₹
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-cyan-300 group-hover:text-white mt-1">
            Collect
          </span>
        </button>

        {/* Tab 3: Customers */}
        <button
          onClick={() => onSelectTab('customers')}
          className={`flex flex-col items-center gap-1 px-3 sm:px-6 py-1 rounded-xl transition-all cursor-pointer ${
            currentTab === 'customers'
              ? 'text-[#00e5ff] bg-cyan-950/40 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Users className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-tight">Customers</span>
        </button>

        {/* Tab 4: Loans */}
        <button
          onClick={() => onSelectTab('loans')}
          className={`flex flex-col items-center gap-1 px-3 sm:px-6 py-1 rounded-xl transition-all cursor-pointer ${
            currentTab === 'loans'
              ? 'text-[#00e5ff] bg-cyan-950/40 border border-cyan-500/30 shadow-[0_0_10px_rgba(0,229,255,0.2)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <FileText className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-tight">Loans</span>
        </button>

        {/* Tab 5: Menu */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center gap-1 px-3 sm:px-6 py-1 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 transition-all cursor-pointer"
        >
          <Menu className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-tight">Menu</span>
        </button>

      </div>
    </div>
  );
};
