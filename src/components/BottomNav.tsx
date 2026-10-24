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
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#070b14]/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-between">
        
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentTab === 'dashboard' ? 'text-[#00e5ff]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Dashboard</span>
        </button>

        {/* Tab 2: Collect (Cyan circle with Indian Rupee symbol) */}
        <button
          onClick={onOpenCollect}
          className="flex flex-col items-center -mt-5 group"
        >
          <div className="w-12 h-12 rounded-full bg-[#00e5ff] text-black flex items-center justify-center font-bold text-lg shadow-[0_0_20px_rgba(0,229,255,0.5)] group-hover:scale-105 transition-transform">
            ₹
          </div>
          <span className="text-[10px] font-medium text-slate-400 group-hover:text-cyan-300 mt-0.5">
            Collect
          </span>
        </button>

        {/* Tab 3: Customers */}
        <button
          onClick={() => onSelectTab('customers')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentTab === 'customers' ? 'text-[#00e5ff]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Customers</span>
        </button>

        {/* Tab 4: Loans */}
        <button
          onClick={() => onSelectTab('loans')}
          className={`flex flex-col items-center gap-1 transition-colors ${
            currentTab === 'loans' ? 'text-[#00e5ff]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Loans</span>
        </button>

        {/* Tab 5: Menu */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium tracking-tight">Menu</span>
        </button>

      </div>
    </div>
  );
};
