import React from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';
import { User, Farm } from '../../types';

interface TopBarProps {
  user: User | null;
  farms: Farm[];
  selectedFarmId: number;
  onSelectFarm: (farmId: number) => void;
  isSimulating: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  farms,
  selectedFarmId,
  onSelectFarm,
  isSimulating,
}) => {
  return (
    <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input */}
      <div className="relative w-80">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Search trees, disease, cameras... (⌘K)"
          className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs font-medium pl-10 pr-4 py-2.5 rounded-2xl border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition outline-none text-slate-800 placeholder-slate-400"
        />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Live Simulation Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold border transition ${
          isSimulating
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-slate-50 border-slate-200 text-slate-500'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
          <span>{isSimulating ? 'Rail-Cam Scouting: Active' : 'Rail-Cam: Idle'}</span>
        </div>

        {/* Farm Switcher Dropdown */}
        <div className="relative flex items-center bg-slate-100/80 hover:bg-slate-100 px-3 py-2 rounded-2xl border border-slate-200/60 transition cursor-pointer">
          <select
            value={selectedFarmId}
            onChange={(e) => onSelectFarm(Number(e.target.value))}
            aria-label="Select Farm"
            className="appearance-none bg-transparent pr-6 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.location.split(',')[0]})
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 text-slate-400 pointer-events-none" />
        </div>

        {/* Notifications */}
        <button aria-label="Notifications" className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition relative">
          <Bell size={18} />
          <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-emerald-700/10">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.full_name || 'Admin Mithilesh'}</p>
            <p className="text-[11px] font-semibold text-slate-400">{user?.role || 'FARM_MANAGER'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
