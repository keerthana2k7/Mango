import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Pill,
  Eye,
  Scan,
} from 'lucide-react';
import { Tree, SimulationStatus } from '../../types';

interface LiveTreeInspectionCardProps {
  tree: Tree | null;
  simulationStatus: SimulationStatus | null;
  onOpenModal: (tree: Tree) => void;
}

export const LiveTreeInspectionCard: React.FC<LiveTreeInspectionCardProps> = ({
  tree,
  simulationStatus,
  onOpenModal,
}) => {
  const isCapturing = simulationStatus?.is_capturing || simulationStatus?.status === 'CAPTURING';
  const prediction = simulationStatus?.last_prediction || tree?.latest_prediction;
  const isHealthy = (tree?.health_status || simulationStatus?.current_tree_health) === 'HEALTHY';
  const isDiseased = (tree?.health_status || simulationStatus?.current_tree_health) === 'DISEASE_DETECTED';

  const confidencePercent = prediction?.confidence
    ? Math.round(prediction.confidence * 100)
    : isHealthy
    ? 96
    : isDiseased
    ? 92
    : 0;

  const diseaseName = prediction?.disease_name || (isHealthy ? 'Healthy Canopy' : isDiseased ? 'Anthracnose' : 'Scanning...');

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-5 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Scan size={16} className={isCapturing ? 'animate-spin' : ''} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight">Live Foliar Inspection</h3>
              <p className="text-[11px] font-semibold text-slate-400">
                {tree ? `Tree ${tree.tree_number}` : 'Awaiting Checkpoint'}
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase rounded-xl flex items-center gap-1 ${
              isHealthy
                ? 'bg-emerald-100 text-emerald-800'
                : isDiseased
                ? 'bg-rose-100 text-rose-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isHealthy ? (
              <>
                <CheckCircle2 size={12} />
                <span>Healthy</span>
              </>
            ) : isDiseased ? (
              <>
                <AlertTriangle size={12} />
                <span>Disease Alert</span>
              </>
            ) : (
              <>
                <HelpCircle size={12} />
                <span>Pending</span>
              </>
            )}
          </span>
        </div>

        {/* Tree Specimen & Leaf Viewfinder */}
        <div className="my-3 p-3 bg-gradient-to-b from-[#F9FBF9] to-[#F2F7F3] rounded-2xl border border-emerald-900/5 relative overflow-hidden flex items-center gap-3.5">
          {/* Simulated Leaf Camera Viewfinder */}
          <div className="w-16 h-16 rounded-xl bg-emerald-800 flex items-center justify-center text-3xl shadow-md shadow-emerald-950/20 relative overflow-hidden flex-shrink-0">
            <span>🌿</span>
            {isCapturing && (
              <div className="absolute inset-0 bg-amber-400/30 animate-pulse border-2 border-amber-400 rounded-xl" />
            )}
            <div className="absolute top-1 left-1 text-[8px] font-black text-white/70 bg-black/40 px-1 rounded">
              RGB
            </div>
          </div>

          {/* Tree Specs */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-slate-900 truncate">
              {tree?.tree_number || 'T-R01-C01'} ({tree?.variety || 'Alphonso'})
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-0.5">
              Row {tree?.row_number || 1} • Column {tree?.column_number || 1}
            </div>

            {/* Disease Classification */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-slate-800">
                {diseaseName}
              </span>
            </div>
          </div>
        </div>

        {/* AI Confidence Meter */}
        <div className="mb-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600 mb-1.5">
            <span className="flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" />
              ML Diagnostic Confidence
            </span>
            <span className={isDiseased ? 'text-rose-600 font-black' : 'text-emerald-700 font-black'}>
              {confidencePercent}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDiseased
                  ? 'bg-gradient-to-r from-rose-500 to-red-600'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600'
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {/* AI Prescription / Treatment */}
        {isDiseased && (
          <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200/70 text-xs">
            <div className="flex items-center gap-1.5 font-extrabold text-rose-900 mb-1">
              <Pill size={13} className="text-rose-600" />
              <span>Recommended Agronomy Treatment:</span>
            </div>
            <p className="text-[11px] font-medium text-rose-700 leading-relaxed">
              {prediction?.treatment || 'Apply Copper Oxychloride 50 WP (0.3%) or Mancozeb spray at 15-day intervals.'}
            </p>
          </div>
        )}
      </div>

      {/* View Full History Button */}
      {tree && (
        <button
          onClick={() => onOpenModal(tree)}
          className="mt-3 w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-98"
        >
          <Eye size={14} />
          <span>View Full Specimen Diagnostics</span>
        </button>
      )}
    </div>
  );
};
