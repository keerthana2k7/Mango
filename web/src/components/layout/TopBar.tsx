import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, ChevronDown, Download, Check, AlertTriangle, X, TreeDeciduous, Sparkles } from 'lucide-react';
import { User, Farm, AlertRecord, Tree } from '../../types';
import { api } from '../../services/api';

interface TopBarProps {
  user: User | null;
  farms: Farm[];
  trees?: Tree[];
  selectedFarmId: number;
  onSelectFarm: (farmId: number) => void;
  isSimulating: boolean;
  onSelectTreeNumber?: (treeNumber: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  farms,
  trees = [],
  selectedFarmId,
  onSelectFarm,
  isSimulating,
  onSelectTreeNumber,
}) => {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [showAlertFlyout, setShowAlertFlyout] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Poll alerts
  const loadAlerts = () => {
    api.getAlerts(selectedFarmId, false).then(setAlerts).catch(() => {});
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 4000);
    return () => clearInterval(interval);
  }, [selectedFarmId]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchResults(true);
      } else if (e.key === 'Escape') {
        setShowSearchResults(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeAlertsCount = alerts.filter((a) => !a.is_resolved).length;

  // Filtered search results across trees, health status, and disease predictions
  const filteredTrees = searchQuery.trim() === ''
    ? trees.slice(0, 6)
    : trees.filter((t) => {
        const q = searchQuery.toLowerCase();
        const treeNumMatch = t.tree_number.toLowerCase().includes(q);
        const rowColMatch = `row ${t.row_number}`.includes(q) || `col ${t.column_number}`.includes(q) || `r${t.row_number}`.includes(q);
        const healthMatch = t.health_status.toLowerCase().includes(q);
        const diseaseMatch = t.latest_prediction?.disease_name.toLowerCase().includes(q);
        const varietyMatch = t.variety?.toLowerCase().includes(q);
        return treeNumMatch || rowColMatch || healthMatch || diseaseMatch || varietyMatch;
      });

  const handleAcknowledge = async (alertId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.acknowledgeAlert(alertId);
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (alertId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.resolveAlert(alertId);
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCsv = () => {
    setIsExporting(true);
    const url = api.getExportAuditCsvUrl(selectedFarmId);
    window.open(url, '_blank');
    setTimeout(() => setIsExporting(false), 1500);
  };

  const handleSelectSearchResult = (treeNumber: string) => {
    if (onSelectTreeNumber) {
      onSelectTreeNumber(treeNumber);
    }
    setShowSearchResults(false);
    setSearchQuery('');
  };

  return (
    <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Search Input with Interactive Dropdown */}
      <div ref={searchContainerRef} className="relative w-80 lg:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSearchResults(true);
          }}
          onFocus={() => setShowSearchResults(true)}
          placeholder="Search trees, disease, row... (⌘K)"
          className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs font-medium pl-10 pr-9 py-2.5 rounded-2xl border border-transparent focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition outline-none text-slate-800 placeholder-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              searchInputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X size={13} />
          </button>
        )}

        {/* Search Results Dropdown Flyout */}
        {showSearchResults && (
          <div className="absolute left-0 mt-2 w-full bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Quick Filter Chips */}
            <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold text-slate-600">
              <span className="text-slate-400 uppercase tracking-wider text-[9px] mr-1">Quick:</span>
              <button
                onClick={() => setSearchQuery('DISEASE_DETECTED')}
                className="px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 transition"
              >
                Diseased
              </button>
              <button
                onClick={() => setSearchQuery('Anthracnose')}
                className="px-2 py-0.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 transition"
              >
                Anthracnose
              </button>
              <button
                onClick={() => setSearchQuery('TREATED')}
                className="px-2 py-0.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/60 transition"
              >
                Treated
              </button>
              <button
                onClick={() => setSearchQuery('HEALTHY')}
                className="px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 transition"
              >
                Healthy
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 p-1">
              {filteredTrees.length === 0 ? (
                <div className="p-6 text-center text-xs font-semibold text-slate-400">
                  No trees found matching "{searchQuery}"
                </div>
              ) : (
                filteredTrees.map((tree) => {
                  const isHealthy = tree.health_status === 'HEALTHY';
                  const isDiseased = tree.health_status === 'DISEASE_DETECTED';
                  const isTreated = tree.health_status === 'TREATED';

                  return (
                    <div
                      key={tree.id}
                      onClick={() => handleSelectSearchResult(tree.tree_number)}
                      className="p-2.5 hover:bg-slate-50 rounded-xl transition cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                          isHealthy
                            ? 'bg-emerald-100 text-emerald-700'
                            : isDiseased
                            ? 'bg-rose-100 text-rose-700'
                            : isTreated
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <TreeDeciduous size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition">
                              {tree.tree_number}
                            </span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                              isHealthy
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                : isDiseased
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/50'
                                : isTreated
                                ? 'bg-teal-50 text-teal-800 border border-teal-200/50'
                                : 'bg-slate-50 text-slate-600'
                            }`}>
                              {isHealthy ? 'Healthy' : isDiseased ? (tree.latest_prediction?.disease_name || 'Diseased') : isTreated ? 'Treated' : 'Scouting'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            Row {tree.row_number} • Col {tree.column_number} • {tree.variety || 'Alphonso'}
                          </div>
                        </div>
                      </div>

                      {tree.latest_prediction && (
                        <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Sparkles size={11} className="text-amber-500" />
                          <span>{Math.round(tree.latest_prediction.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-semibold flex items-center justify-between">
              <span>Showing {filteredTrees.length} of {trees.length} trees</span>
              <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono">ESC</kbd> to exit</span>
            </div>
          </div>
        )}
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

        {/* Export CSV Audit Report */}
        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          title="Download Orchard Audit & Treatment Log (CSV)"
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200/80 transition active:scale-95"
        >
          <Download size={14} className={isExporting ? 'animate-bounce' : ''} />
          <span className="hidden sm:inline">Export Audit CSV</span>
        </button>

        {/* Notifications & Alert Flyout */}
        <div className="relative">
          <button
            onClick={() => setShowAlertFlyout(!showAlertFlyout)}
            aria-label="Notifications"
            className={`p-2.5 rounded-2xl transition relative ${
              showAlertFlyout ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <Bell size={18} />
            {activeAlertsCount > 0 && (
              <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-[10px] font-black text-white flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white animate-pulse">
                {activeAlertsCount}
              </span>
            )}
          </button>

          {/* Alert Popover */}
          {showAlertFlyout && (
            <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertTriangle size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">Live Orchard Alerts</h4>
                    <p className="text-[10px] font-medium text-slate-500">
                      {activeAlertsCount} unresolved warnings
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAlertFlyout(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                {alerts.length === 0 ? (
                  <div className="p-6 text-center text-xs font-semibold text-slate-400">
                    No active warnings. Orchard is in normal state.
                  </div>
                ) : (
                  alerts.slice(0, 8).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-2xl transition flex flex-col gap-1.5 ${
                        alert.is_resolved
                          ? 'bg-slate-50 opacity-60'
                          : alert.severity === 'CRITICAL'
                          ? 'bg-rose-50/70 border border-rose-200/60'
                          : 'bg-amber-50/70 border border-amber-200/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-200 text-rose-900'
                              : 'bg-amber-200 text-amber-900'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900">{alert.title}</div>
                      <p className="text-[11px] text-slate-600 leading-snug">{alert.message}</p>

                      <div className="flex items-center justify-end gap-2 mt-1">
                        {!alert.is_acknowledged && !alert.is_resolved && (
                          <button
                            onClick={(e) => handleAcknowledge(alert.id, e)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        {!alert.is_resolved && (
                          <button
                            onClick={(e) => handleResolve(alert.id, e)}
                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 transition shadow-sm"
                          >
                            <Check size={11} />
                            Resolve
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
