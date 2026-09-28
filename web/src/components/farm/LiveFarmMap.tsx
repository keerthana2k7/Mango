import React, { useState } from 'react';
import {
  Compass,
  Radio,
  RotateCcw,
  Eye,
  Box,
  LayoutGrid,
  Filter,
  Camera as CameraIcon,
  Sparkles,
  TreeDeciduous,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { FarmScene3D, ViewMode } from './FarmScene3D';
import { Tree, SimulationStatus, FarmLayout } from '../../types';

interface LiveFarmMapProps {
  layout: FarmLayout | null;
  trees: Tree[];
  simulationStatus: SimulationStatus | null;
  onSelectTree: (tree: Tree) => void;
  selectedTreeId?: number | null;
  filterHealth?: 'ALL' | 'HEALTHY' | 'DISEASE_DETECTED' | 'TREATED' | null;
  onFilterHealthChange?: (filter: 'ALL' | 'HEALTHY' | 'DISEASE_DETECTED' | 'TREATED' | null) => void;
}

export const LiveFarmMap: React.FC<LiveFarmMapProps> = ({
  layout,
  trees,
  simulationStatus,
  onSelectTree,
  selectedTreeId,
  filterHealth = 'ALL',
  onFilterHealthChange,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('OVERVIEW');
  const [mapType, setMapType] = useState<'3D' | '2D'>('3D');
  const [resetCount, setResetCount] = useState<number>(0);

  const isCapturing =
    simulationStatus?.is_capturing || simulationStatus?.status === 'CAPTURING';

  const handleResetView = () => {
    setViewMode('OVERVIEW');
    setResetCount((prev) => prev + 1);
  };

  const handleToggleFollow = () => {
    setViewMode((prev) => (prev === 'FOLLOW' ? 'FREE' : 'FOLLOW'));
  };

  // Group trees by row for 2D Grid view
  const rows = [1, 2, 3, 4];
  const activeTreeId = simulationStatus?.current_tree_id;

  const currentFilter = filterHealth || 'ALL';

  const countHealthy = trees.filter((t) => t.health_status === 'HEALTHY').length;
  const countDiseased = trees.filter((t) => t.health_status === 'DISEASE_DETECTED').length;
  const countTreated = trees.filter((t) => t.health_status === 'TREATED').length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-5 relative overflow-hidden flex flex-col justify-between select-none">
      {/* 3D Map Header Overlay */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 z-20">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {mapType === '3D' ? <Box size={18} className="text-emerald-700" /> : <LayoutGrid size={18} className="text-emerald-700" />}
              {mapType === '3D' ? '3D Live Farm Digital Twin' : '2D Overhead Orchard Matrix'}
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Robotic Gantry 01
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Salem Heritage Mango Orchard • Real-time spatial tracking & automated disease inspection
          </p>
        </div>

        {/* View Mode & Camera Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 3D vs 2D Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setMapType('3D')}
              className={`p-1.5 px-2.5 rounded-xl transition flex items-center gap-1 text-[11px] font-bold ${
                mapType === '3D'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box size={13} />
              <span>3D Twin</span>
            </button>
            <button
              onClick={() => setMapType('2D')}
              className={`p-1.5 px-2.5 rounded-xl transition flex items-center gap-1 text-[11px] font-bold ${
                mapType === '2D'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={13} />
              <span>2D Grid</span>
            </button>
          </div>

          {/* Quick Jump Tree Selector */}
          <select
            value={selectedTreeId || ''}
            onChange={(e) => {
              const val = Number(e.target.value);
              const target = trees.find((t) => t.id === val);
              if (target) onSelectTree(target);
            }}
            className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-2 rounded-xl outline-none focus:border-emerald-600 transition"
          >
            <option value="">Jump to Tree...</option>
            {trees.map((t) => (
              <option key={t.id} value={t.id}>
                {t.tree_number} (R{t.row_number}:C{t.column_number}) - {t.health_status === 'DISEASE_DETECTED' ? '🚨 Diseased' : t.health_status === 'TREATED' ? '🛡️ Treated' : '🌿 Healthy'}
              </option>
            ))}
          </select>

          {mapType === '3D' && (
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-2xl border border-slate-200/80 shadow-sm">
              <button
                onClick={() => setViewMode('OVERVIEW')}
                className={`p-1.5 px-2.5 rounded-xl transition flex items-center gap-1 text-[11px] font-bold ${
                  viewMode === 'OVERVIEW'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'hover:bg-white text-slate-700'
                }`}
              >
                <Eye size={12} />
                <span>Overview</span>
              </button>

              <button
                onClick={handleToggleFollow}
                className={`p-1.5 px-2.5 rounded-xl transition flex items-center gap-1 text-[11px] font-bold ${
                  viewMode === 'FOLLOW'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'hover:bg-white text-slate-700'
                }`}
              >
                <Radio size={12} />
                <span>Follow Cam</span>
              </button>

              <button
                onClick={handleResetView}
                title="Reset Camera View"
                className="p-1.5 px-2 rounded-xl hover:bg-white text-slate-700 transition flex items-center gap-1 text-[11px] font-bold"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="my-2.5 flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-bold">
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-slate-400" />
          <span className="text-slate-400 uppercase tracking-wider text-[10px] mr-1">Triage Filter:</span>

          <button
            onClick={() => onFilterHealthChange && onFilterHealthChange('ALL')}
            className={`px-2.5 py-1 rounded-xl transition ${
              currentFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Canopy ({trees.length})
          </button>

          <button
            onClick={() => onFilterHealthChange && onFilterHealthChange('HEALTHY')}
            className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
              currentFilter === 'HEALTHY'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/50'
            }`}
          >
            <CheckCircle2 size={12} />
            <span>Optimal ({countHealthy})</span>
          </button>

          <button
            onClick={() => onFilterHealthChange && onFilterHealthChange('DISEASE_DETECTED')}
            className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
              currentFilter === 'DISEASE_DETECTED'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/50'
            }`}
          >
            <AlertTriangle size={12} />
            <span>Pathogens ({countDiseased})</span>
          </button>

          <button
            onClick={() => onFilterHealthChange && onFilterHealthChange('TREATED')}
            className={`px-2.5 py-1 rounded-xl transition flex items-center gap-1 ${
              currentFilter === 'TREATED'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/50'
            }`}
          >
            <ShieldCheck size={12} />
            <span>Treated ({countTreated})</span>
          </button>
        </div>

        <div className="text-[10px] font-semibold text-slate-400">
          Showing {currentFilter === 'ALL' ? trees.length : trees.filter((t) => t.health_status === currentFilter).length} trees
        </div>
      </div>

      {/* Main Map Viewport (3D or 2D) */}
      {mapType === '3D' ? (
        <div className="my-1 rounded-2xl border border-emerald-900/10 bg-[#EDF5EE] relative overflow-hidden h-[460px] shadow-inner">
          <FarmScene3D
            layout={layout}
            trees={trees}
            simulationStatus={simulationStatus}
            onSelectTree={onSelectTree}
            selectedTreeId={selectedTreeId}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            resetTrigger={resetCount}
          />

          {/* Floating Telemetry Badge */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-2.5 z-10 pointer-events-none">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isCapturing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <div>
              <div className="text-[11px] font-black text-slate-800">
                {simulationStatus?.current_tree_number
                  ? `Inspecting ${simulationStatus.current_tree_number}`
                  : 'Gantry Cam 01 Ready'}
              </div>
              <div className="text-[10px] font-bold text-slate-500 font-mono">
                X: {simulationStatus?.x?.toFixed(1) || '15.0'}m • Y: {simulationStatus?.y?.toFixed(1) || '16.0'}m
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg ml-1">
              {simulationStatus?.speed_m_per_s || 1.0} m/s
            </span>
          </div>

          {/* 3D Orbit Help Pill */}
          <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-white/90 pointer-events-none z-10 flex items-center gap-1.5">
            <Compass size={11} className="text-emerald-400" />
            <span>Left click + drag to Orbit • Scroll to Zoom</span>
          </div>

          {/* Compact Map Legend */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-3 text-[10px] font-bold text-slate-700 z-10 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
              <span>Diseased</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shadow-sm" />
              <span>Treated</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>Active Scan</span>
            </div>
          </div>
        </div>
      ) : (
        /* 2D Overhead Orchard Matrix View */
        <div className="my-1 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 h-[460px] overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-700 pb-2 border-b border-slate-200/80">
            <span className="flex items-center gap-1.5">
              <LayoutGrid size={14} className="text-emerald-700" />
              <span>Overhead Rail Corridor Grid (4 Rows × 6 Columns)</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Click any tree to inspect foliar diagnostics
            </span>
          </div>

          {rows.map((rowNum) => {
            const rowTrees = trees.filter((t) => t.row_number === rowNum);
            const isCarriageOnThisRow = simulationStatus?.current_row === rowNum;

            return (
              <div key={rowNum} className="relative bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
                {/* Steel Rail Line Indicator */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 pointer-events-none z-0" />

                <div className="relative z-10 flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                      Row 0{rowNum}
                    </span>
                    {isCarriageOnThisRow && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1 border border-amber-300 animate-pulse">
                        <CameraIcon size={11} />
                        <span>Carriage Active on Row 0{rowNum}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    6 Commercial Mango Trees • Y = {16 + (rowNum - 1) * 22}m
                  </span>
                </div>

                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {rowTrees.map((tree) => {
                    const isHealthy = tree.health_status === 'HEALTHY';
                    const isDiseased = tree.health_status === 'DISEASE_DETECTED';
                    const isTreated = tree.health_status === 'TREATED';
                    const isInspected = activeTreeId === tree.id;
                    const isSelected = selectedTreeId === tree.id;

                    const matchesFilter =
                      currentFilter === 'ALL' || tree.health_status === currentFilter;

                    return (
                      <div
                        key={tree.id}
                        onClick={() => onSelectTree(tree)}
                        className={`p-2.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between relative group ${
                          !matchesFilter ? 'opacity-30' : ''
                        } ${
                          isSelected
                            ? 'ring-3 ring-blue-500 bg-blue-50/50 border-blue-300'
                            : isInspected
                            ? 'ring-3 ring-amber-400 bg-amber-50/60 border-amber-300 shadow-md'
                            : isDiseased
                            ? 'bg-rose-50/60 border-rose-200 hover:border-rose-400'
                            : isTreated
                            ? 'bg-teal-50/60 border-teal-200 hover:border-teal-400'
                            : 'bg-white border-slate-200/90 hover:border-emerald-400 hover:shadow-sm'
                        }`}
                      >
                        {isInspected && (
                          <div className="absolute -top-2 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold shadow-sm animate-bounce">
                            🎯
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-slate-900 group-hover:text-emerald-700">
                            {tree.tree_number}
                          </span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isHealthy
                                ? 'bg-emerald-500'
                                : isDiseased
                                ? 'bg-rose-500 animate-pulse'
                                : isTreated
                                ? 'bg-teal-500'
                                : 'bg-slate-300'
                            }`}
                          />
                        </div>

                        <div className="text-[10px] font-semibold text-slate-500 truncate mb-1">
                          Col 0{tree.column_number} • {tree.variety || 'Alphonso'}
                        </div>

                        <div className="mt-1">
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded block text-center truncate ${
                              isHealthy
                                ? 'bg-emerald-100 text-emerald-800'
                                : isDiseased
                                ? 'bg-rose-100 text-rose-800'
                                : isTreated
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isHealthy
                              ? 'Healthy'
                              : isDiseased
                              ? (tree.latest_prediction?.disease_name || 'Diseased')
                              : isTreated
                              ? 'Treated'
                              : 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
