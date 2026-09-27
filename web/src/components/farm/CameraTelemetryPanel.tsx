import React from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  StepForward,
  Gauge,
  Activity,
  Compass,
  Battery,
  MapPin,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { SimulationStatus } from '../../types';

interface CameraTelemetryPanelProps {
  simulationStatus: SimulationStatus | null;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onStartSimulation: (speed: number) => void;
  onPauseSimulation: () => void;
  onStopSimulation: () => void;
  onResetSimulation: () => void;
  onStepSimulation: () => void;
}

export const CameraTelemetryPanel: React.FC<CameraTelemetryPanelProps> = ({
  simulationStatus,
  speed,
  onSpeedChange,
  onStartSimulation,
  onPauseSimulation,
  onStopSimulation,
  onResetSimulation,
  onStepSimulation,
}) => {
  const isRunning =
    simulationStatus?.status === 'MOVING' || simulationStatus?.status === 'CAPTURING';
  const isCapturing = simulationStatus?.is_capturing || simulationStatus?.status === 'CAPTURING';
  const direction = simulationStatus?.direction || (simulationStatus?.current_row && simulationStatus.current_row % 2 === 1 ? 'FORWARD' : 'BACKWARD');

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-5 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
              01
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Camera Telemetry</h3>
              <p className="text-[11px] font-semibold text-slate-400">Overhead Robotic Gantry</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/60">
              <Battery size={13} className="text-emerald-600" />
              <span>95%</span>
            </div>
            <span
              className={`px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase rounded-xl flex items-center gap-1.5 ${
                isCapturing
                  ? 'bg-amber-100 text-amber-800'
                  : isRunning
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isCapturing ? 'bg-amber-500 animate-ping' : isRunning ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'
                }`}
              />
              {isCapturing ? 'CAPTURING' : isRunning ? 'MOVING' : 'ONLINE'}
            </span>
          </div>
        </div>

        {/* Telemetry Metric Grid */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          {/* Spatial World Coordinates */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              <MapPin size={12} className="text-emerald-600" />
              <span>World Position</span>
            </div>
            <div className="text-xs font-black text-slate-800 font-mono">
              X: {simulationStatus?.x?.toFixed(1) || '15.0'}m
              <span className="text-slate-400 font-normal"> / </span>
              Y: {simulationStatus?.y?.toFixed(1) || '16.0'}m
            </div>
          </div>

          {/* Current Row & Tree */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              <Compass size={12} className="text-blue-600" />
              <span>Checkpoint</span>
            </div>
            <div className="text-xs font-black text-slate-800">
              Row 0{simulationStatus?.current_row || 1} • Tree #{simulationStatus?.current_column || 1}
            </div>
          </div>

          {/* Velocity & Speed */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              <Gauge size={12} className="text-amber-600" />
              <span>Speed</span>
            </div>
            <div className="text-xs font-black text-slate-800">
              {simulationStatus?.speed_m_per_s || speed} m/s
            </div>
          </div>

          {/* Heading Direction */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              <Activity size={12} className="text-purple-600" />
              <span>Direction</span>
            </div>
            <div className="text-xs font-black text-slate-800 flex items-center gap-1">
              {direction === 'FORWARD' ? (
                <>
                  <span>FORWARD</span>
                  <ArrowRight size={13} className="text-emerald-600" />
                </>
              ) : (
                <>
                  <span>BACKWARD</span>
                  <ArrowLeft size={13} className="text-amber-600" />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scouting Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600 mb-1.5">
            <span>Route Progress</span>
            <span className="text-emerald-700">{simulationStatus?.progress_percentage || 0}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, simulationStatus?.progress_percentage || 0))}%` }}
            />
          </div>
        </div>

        {/* Speed Slider */}
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Gauge size={14} className="text-slate-400" />
              Simulation Speed
            </span>
            <span className="text-emerald-700 font-extrabold">{speed}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.5"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            aria-label="Simulation Speed Slider"
            className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
          />
        </div>
      </div>

      {/* Control Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={() => onStartSimulation(speed)}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-extrabold shadow-md shadow-emerald-700/20 transition active:scale-98"
            >
              <Play size={15} />
              <span>Start Scouting</span>
            </button>
          ) : (
            <button
              onClick={onPauseSimulation}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-extrabold shadow-md transition active:scale-98"
            >
              <Pause size={15} />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={onStepSimulation}
            title="Step next tree checkpoint"
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-extrabold transition active:scale-95"
          >
            <StepForward size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onStopSimulation}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-98"
          >
            <Square size={13} />
            <span>Stop</span>
          </button>
          <button
            onClick={onResetSimulation}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-98"
          >
            <RotateCcw size={13} />
            <span>Reset Origin</span>
          </button>
        </div>
      </div>
    </div>
  );
};
