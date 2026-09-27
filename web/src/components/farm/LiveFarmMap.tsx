import React, { useState } from 'react';
import {
  Compass,
  Radio,
  RotateCcw,
  Eye,
  Maximize2,
  Box,
} from 'lucide-react';
import { FarmScene3D, ViewMode } from './FarmScene3D';
import { Tree, SimulationStatus, FarmLayout } from '../../types';

interface LiveFarmMapProps {
  layout: FarmLayout | null;
  trees: Tree[];
  simulationStatus: SimulationStatus | null;
  onSelectTree: (tree: Tree) => void;
  selectedTreeId?: number | null;
}

export const LiveFarmMap: React.FC<LiveFarmMapProps> = ({
  layout,
  trees,
  simulationStatus,
  onSelectTree,
  selectedTreeId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('OVERVIEW');
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

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-5 relative overflow-hidden flex flex-col justify-between select-none">
      {/* 3D Map Header Overlay */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 z-20">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Box size={18} className="text-emerald-700" />
              3D Live Farm Digital Twin
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Overhead Gantry 3D
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Salem Heritage Mango Orchard • Real-time 3D spatial monitoring & automated disease inspection
          </p>
        </div>

        {/* View Mode & Camera Controls Toolbar */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200/80 shadow-sm">
          <button
            onClick={() => setViewMode('OVERVIEW')}
            className={`p-1.5 px-3 rounded-xl transition flex items-center gap-1 text-[11px] font-bold ${
              viewMode === 'OVERVIEW'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'hover:bg-white text-slate-700'
            }`}
          >
            <Eye size={13} />
            <span>Overview</span>
          </button>

          <button
            onClick={handleToggleFollow}
            className={`p-1.5 px-3 rounded-xl transition flex items-center gap-1 text-[11px] font-bold ${
              viewMode === 'FOLLOW'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'hover:bg-white text-slate-700'
            }`}
          >
            <Radio size={13} />
            <span>Follow Cam</span>
          </button>

          <div className="w-[1px] h-4 bg-slate-200" />

          <button
            onClick={handleResetView}
            title="Reset 3D Camera View"
            className="p-1.5 px-2 rounded-xl hover:bg-white text-slate-700 hover:text-emerald-700 transition shadow-none hover:shadow-sm flex items-center gap-1 text-[11px] font-bold"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Viewport */}
      <div className="my-3 rounded-2xl border border-emerald-900/10 bg-[#EDF5EE] relative overflow-hidden h-[460px] shadow-inner">
        {/* 3D WebGL Canvas */}
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

        {/* Floating Telemetry Badge (Top Left Inside Map) */}
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

        {/* 3D Orbit Help Pill (Top Right Inside Map) */}
        <div className="absolute top-3 right-3 bg-slate-900/70 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-white/90 pointer-events-none z-10 flex items-center gap-1.5">
          <Compass size={11} className="text-emerald-400" />
          <span>Left click + drag to Orbit • Scroll to Zoom</span>
        </div>

        {/* Compact Map Legend (Bottom Left Inside Map) */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-3.5 text-[10px] font-bold text-slate-700 z-10 pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span>Healthy Canopy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm" />
            <span>Diseased Halo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>Active Scan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-sm bg-slate-700" />
            <span>Overhead Rail</span>
          </div>
        </div>
      </div>
    </div>
  );
};
