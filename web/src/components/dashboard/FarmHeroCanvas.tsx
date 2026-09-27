import React from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  StepForward,
  Camera as CameraIcon,
  Activity,
  Gauge
} from 'lucide-react';
import { Tree, SimulationStatus } from '../../types';

interface FarmHeroCanvasProps {
  trees: Tree[];
  simulationStatus: SimulationStatus | null;
  onStartSimulation: (speed: number) => void;
  onPauseSimulation: () => void;
  onStopSimulation: () => void;
  onResetSimulation: () => void;
  onStepSimulation: () => void;
  onSelectTree: (tree: Tree) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const FarmHeroCanvas: React.FC<FarmHeroCanvasProps> = ({
  trees,
  simulationStatus,
  onStartSimulation,
  onPauseSimulation,
  onStopSimulation,
  onResetSimulation,
  onStepSimulation,
  onSelectTree,
  speed,
  onSpeedChange,
}) => {
  // Organize trees into 4 rows (or dynamic rows)
  const rows = [1, 2, 3, 4];
  const isRunning = simulationStatus?.status === 'MOVING' || simulationStatus?.status === 'CAPTURING';
  const currentTreeId = simulationStatus?.current_tree_id;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between relative overflow-hidden">
      {/* Canvas Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Interactive Orchard Field Canvas</h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase rounded-full bg-emerald-100 text-emerald-800">
              Live Overhead Rail
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Real-time multi-spectral camera trajectory & leaf disease diagnostics
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 px-3.5 py-1.5 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span>Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <span>Diseased</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span>Unknown</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>Inspecting</span>
          </div>
        </div>
      </div>

      {/* Main Visual Orchard Grid */}
      <div className="my-6 py-4 px-6 bg-gradient-to-b from-[#F9FBF9] to-[#F2F7F3] rounded-3xl border border-emerald-900/5 relative select-none overflow-x-auto min-w-[620px]">
        {/* Subtle grid background pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#064E3B 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="space-y-6 relative z-10">
          {rows.map((rowNum) => {
            const rowTrees = trees.filter((t) => t.row_number === rowNum);
            const isCameraInThisRow = simulationStatus?.current_row === rowNum;

            return (
              <div key={rowNum} className="relative">
                {/* Row Header */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-2 px-1">
                  <span>ORCHARD ROW 0{rowNum}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                    Alphonso High Density
                  </span>
                </div>

                {/* Trees Row Grid */}
                <div className="grid grid-cols-6 gap-3 relative z-10">
                  {rowTrees.map((tree) => {
                    const isInspected = currentTreeId === tree.id;
                    const isHealthy = tree.health_status === 'HEALTHY';
                    const isDiseased = tree.health_status === 'DISEASE_DETECTED';

                    return (
                      <div
                        key={tree.id}
                        onClick={() => onSelectTree(tree)}
                        className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-center relative group ${
                          isInspected
                            ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-400/20 shadow-lg scale-105'
                            : isHealthy
                            ? 'bg-white border-emerald-200/80 hover:border-emerald-400 hover:shadow-md'
                            : isDiseased
                            ? 'bg-rose-50/70 border-rose-200 hover:border-rose-400 hover:shadow-md'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Status Icon / Tree Graphic */}
                        <div className="relative mb-1.5">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 ${
                            isInspected
                              ? 'bg-amber-100 text-amber-700 inspecting-pulse'
                              : isHealthy
                              ? 'bg-emerald-100/70 text-emerald-700'
                              : isDiseased
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            🌳
                          </div>
                          {isInspected && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                          )}
                        </div>

                        {/* Tree Number */}
                        <span className="text-xs font-extrabold text-slate-800">{tree.tree_number}</span>

                        {/* Disease Tag */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                          isHealthy
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDiseased
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {isHealthy ? 'Healthy' : isDiseased ? (tree.latest_prediction?.disease_name || 'Diseased') : 'Unknown'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Overhead Camera Rail Track (Rendered below row) */}
                <div className="mt-3 py-1.5 px-4 bg-slate-900/5 rounded-2xl border border-slate-900/10 flex items-center justify-between relative overflow-hidden">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest">
                      Overhead Rail 0{rowNum}
                    </span>
                  </div>

                  {/* Rail Track Line */}
                  <div className="flex-1 mx-4 h-[2px] bg-slate-300 relative">
                    {isCameraInThisRow && (
                      <div
                        className="absolute -top-3 transition-all duration-700 ease-out flex items-center gap-1 bg-emerald-700 text-white px-2.5 py-1 rounded-xl shadow-lg shadow-emerald-700/30 ring-2 ring-white cursor-pointer -translate-x-1/2"
                        style={{
                          left: `${((simulationStatus?.current_column || 1) - 0.5) * (100 / 6)}%`,
                        }}
                      >
                        <CameraIcon size={12} className={isRunning ? 'animate-pulse' : ''} />
                        <span className="text-[10px] font-extrabold whitespace-nowrap">
                          Rail-Cam {simulationStatus?.is_capturing ? '📷 Flash' : '▶'}
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="text-[9px] font-semibold text-slate-400">24.0m</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time Diagnostics & Control Bar */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        {/* Telemetry Readout */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-700 shadow-sm">
            <Activity size={20} className={isRunning ? 'animate-pulse' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-900">
                {simulationStatus?.current_tree_number ? `Inspecting ${simulationStatus.current_tree_number}` : 'Rail-Cam Ready'}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                {simulationStatus?.speed_m_per_s || speed} m/s
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {simulationStatus?.last_event || 'Click Start to begin automated disease scouting along rail path.'}
            </p>
          </div>
        </div>

        {/* Speed Slider */}
        <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-2xl border border-slate-200">
          <Gauge size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-700">Speed: {speed}x</span>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.5"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            aria-label="Simulation Speed"
            className="w-20 accent-emerald-600 cursor-pointer"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={() => onStartSimulation(speed)}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-700/20 transition active:scale-95"
            >
              <Play size={14} />
              <span>Start Scouting</span>
            </button>
          ) : (
            <button
              onClick={onPauseSimulation}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-bold shadow-md transition active:scale-95"
            >
              <Pause size={14} />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onStepSimulation}
            title="Step next tree"
            className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 text-xs font-bold transition active:scale-95"
          >
            <StepForward size={16} />
          </button>

          <button
            onClick={onStopSimulation}
            title="Stop simulation"
            className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 text-xs font-bold transition active:scale-95"
          >
            <Square size={16} />
          </button>

          <button
            onClick={onResetSimulation}
            title="Reset to Origin"
            className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 text-xs font-bold transition active:scale-95"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
