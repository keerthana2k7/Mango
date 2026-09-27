import React from 'react';
import {
  LayoutDashboard,
  Trees,
  Camera,
  PlayCircle,
  Activity,
  Image as ImageIcon,
  BarChart3,
  LogOut,
  Smartphone,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'farms', label: 'Farms & Trees', icon: Trees },
    { id: 'cameras', label: 'Cameras', icon: Camera },
    { id: 'simulation', label: 'Live Simulation', icon: PlayCircle },
    { id: 'predictions', label: 'Disease Predictions', icon: Activity },
    { id: 'images', label: 'Image Gallery', icon: ImageIcon },
    { id: 'analytics', label: 'Farm Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between p-5 min-h-screen select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-2 py-2 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-700/20">
            <span className="text-xl">🌿</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-slate-900 leading-tight">MangoVision</h1>
            <p className="text-[11px] font-medium text-emerald-600 tracking-wide uppercase">Smart Farm Platform</p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Main Menu</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>
                    <Icon size={18} />
                  </div>
                  <span>{item.label}</span>
                </div>
                {isActive && <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Mobile App Promo (Inspired by Donezo / Reference 3) */}
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-4 rounded-3xl relative overflow-hidden shadow-xl shadow-emerald-950/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Smartphone size={16} />
            </div>
            <span className="text-xs font-bold tracking-wide uppercase text-emerald-400">Mobile Field App</span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed mb-3">
            Real-time scouting & tree inspection in your orchard on Expo.
          </p>
          <div className="flex items-center justify-between bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition">
            <span>Open Expo Client</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {/* Footer Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
