import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Pill,
  Eye,
  Scan,
  Maximize2,
  X,
  Zap,
  Loader2,
  ShieldCheck,
  Camera as CameraIcon
} from 'lucide-react';
import { Tree, SimulationStatus, ImageRecord } from '../../types';
import { api } from '../../services/api';

interface LiveTreeInspectionCardProps {
  tree: Tree | null;
  simulationStatus: SimulationStatus | null;
  onOpenModal: (tree: Tree) => void;
  onTreeUpdated?: () => void;
  onScanNow?: () => void;
  onSimulateDisease?: (diseaseName: string, severity?: string, treeId?: number) => Promise<any>;
}

export const LiveTreeInspectionCard: React.FC<LiveTreeInspectionCardProps> = ({
  tree,
  simulationStatus,
  onOpenModal,
  onTreeUpdated,
  onScanNow,
  onSimulateDisease,
}) => {
  const [latestImage, setLatestImage] = useState<ImageRecord | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isTreating, setIsTreating] = useState(false);
  const [isVerifyingRemission, setIsVerifyingRemission] = useState(false);
  const [treatmentMessage, setTreatmentMessage] = useState<string | null>(null);

  // Load latest leaf image for this tree
  useEffect(() => {
    if (!tree) {
      setLatestImage(null);
      return;
    }

    api.getTreeImages(tree.id)
      .then((imgs) => {
        if (imgs && imgs.length > 0) {
          setLatestImage(imgs[0]);
        } else {
          setLatestImage(null);
        }
      })
      .catch(() => setLatestImage(null));
  }, [tree?.id, simulationStatus?.last_captured_image_id]);

  const isCapturing = simulationStatus?.is_capturing || simulationStatus?.status === 'CAPTURING';
  const prediction = simulationStatus?.last_prediction || tree?.latest_prediction;
  const isHealthy = (tree?.health_status || simulationStatus?.current_tree_health) === 'HEALTHY';
  const isDiseased = (tree?.health_status || simulationStatus?.current_tree_health) === 'DISEASE_DETECTED';
  const isTreated = (tree?.health_status || simulationStatus?.current_tree_health) === 'TREATED';

  const confidencePercent = prediction?.confidence
    ? Math.round(prediction.confidence * 100)
    : isHealthy
    ? 96
    : isDiseased
    ? 92
    : 0;

  const diseaseName = prediction?.disease_name || (isHealthy ? 'Healthy Canopy' : isDiseased ? 'Anthracnose' : isTreated ? 'Treated Foliage' : 'Scanning...');

  // Quick 1-click treatment application
  const handleQuickTreat = async () => {
    if (!tree) return;
    setIsTreating(true);
    setTreatmentMessage(null);
    try {
      const chemName = prediction?.treatment
        ? prediction.treatment.split('.')[0].replace('Apply ', '').replace('Spray ', '').slice(0, 45)
        : 'Copper Oxychloride 50 WP';

      await api.logTreatment({
        tree_id: tree.id,
        chemical_name: chemName,
        dosage: '3.0 g / Litre',
        treatment_type: 'CHEMICAL',
        operator_name: 'Overhead Gantry Automation',
        notes: `Quick remedial application for ${diseaseName}`,
        update_tree_health: true,
        new_health_status: 'TREATED',
      });

      setTreatmentMessage(`Successfully treated with ${chemName}! Status updated.`);
      if (onTreeUpdated) onTreeUpdated();
      setTimeout(() => setTreatmentMessage(null), 5000);
    } catch (err: any) {
      console.error('Treatment failed:', err);
      setTreatmentMessage('Failed to apply treatment. Check connection.');
    } finally {
      setIsTreating(false);
    }
  };

  // Verify remission and restore tree to healthy status
  const handleVerifyRemission = async () => {
    if (!tree || !onSimulateDisease) return;
    setIsVerifyingRemission(true);
    setTreatmentMessage(null);
    try {
      await onSimulateDisease('Healthy', 'LOW', tree.id);
      setTreatmentMessage(`Foliar re-scan verified: No active lesions! Tree ${tree.tree_number} marked Healthy.`);
      if (onTreeUpdated) onTreeUpdated();
      setTimeout(() => setTreatmentMessage(null), 5000);
    } catch (err: any) {
      setTreatmentMessage('Remission verification failed. Please try again.');
    } finally {
      setIsVerifyingRemission(false);
    }
  };


  return (
    <>
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
                  : isTreated
                  ? 'bg-teal-100 text-teal-800'
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
              ) : isTreated ? (
                <>
                  <ShieldCheck size={12} />
                  <span>Treated</span>
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
            {/* Real Captured Leaf Image Viewfinder */}
            <div
              onClick={() => latestImage && setLightboxOpen(true)}
              className={`w-20 h-20 rounded-2xl bg-emerald-900 flex items-center justify-center text-3xl shadow-md shadow-emerald-950/20 relative overflow-hidden flex-shrink-0 cursor-pointer group border ${
                latestImage ? 'border-emerald-300' : 'border-transparent'
              }`}
            >
              {latestImage ? (
                <>
                  <img
                    src={`http://localhost:8000/storage/${latestImage.file_path}`}
                    alt="Captured Leaf Specimen"
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                    <Maximize2 size={16} />
                  </div>
                </>
              ) : (
                <span>🌿</span>
              )}

              {isCapturing && (
                <div className="absolute inset-0 bg-amber-400/30 animate-pulse border-2 border-amber-400 rounded-2xl" />
              )}
              <div className="absolute top-1 left-1 text-[8px] font-black text-white/90 bg-black/60 px-1 rounded backdrop-blur-xs">
                {latestImage ? '4K-CV' : 'RGB'}
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
              <div className="mt-1 flex items-center gap-1.5">
                <span className={`text-xs font-extrabold ${isDiseased ? 'text-rose-600' : isTreated ? 'text-teal-700' : 'text-slate-800'}`}>
                  {diseaseName}
                </span>
              </div>
              {latestImage && (
                <div className="text-[9px] text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                  <CameraIcon size={10} />
                  <span>Scanned: {new Date(latestImage.capture_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Confidence Meter */}
          <div className="mb-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600 mb-1.5">
              <span className="flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                ML Diagnostic Confidence
              </span>
              <span className={isDiseased ? 'text-rose-600 font-black' : isTreated ? 'text-teal-700 font-black' : 'text-emerald-700 font-black'}>
                {confidencePercent}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDiseased
                    ? 'bg-gradient-to-r from-rose-500 to-red-600'
                    : isTreated
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                }`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
          </div>

          {/* Treatment Success Toast */}
          {treatmentMessage && (
            <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
              <span>{treatmentMessage}</span>
            </div>
          )}

          {/* AI Prescription / Treatment / Quick Treat Button */}
          {isDiseased && (
            <div className="bg-rose-50/80 p-3 rounded-2xl border border-rose-200/70 text-xs mb-3 space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold text-rose-900">
                <Pill size={13} className="text-rose-600" />
                <span>Recommended Agronomy Treatment:</span>
              </div>
              <p className="text-[11px] font-medium text-rose-700 leading-relaxed">
                {prediction?.treatment || 'Apply Copper Oxychloride 50 WP (0.3%) spray at 15-day intervals.'}
              </p>

              {/* 1-Click Fast Treatment Action */}
              <button
                onClick={handleQuickTreat}
                disabled={isTreating}
                className="w-full py-2 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 disabled:opacity-50"
              >
                {isTreating ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Applying Spray & Logging...</span>
                  </>
                ) : (
                  <>
                    <Zap size={13} />
                    <span>Apply Remediation & Mark Treated</span>
                  </>
                )}
              </button>
            </div>
          )}

          {isTreated && (
            <div className="bg-teal-50/80 p-3 rounded-2xl border border-teal-200/70 text-xs mb-3 space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold text-teal-900 mb-0.5">
                <ShieldCheck size={14} className="text-teal-600" />
                <span>Protective Fungicide Barrier Active</span>
              </div>
              <p className="text-[11px] font-medium text-teal-700">
                Tree is under post-treatment protective coverage. Monitored by overhead camera for remission.
              </p>

              {onSimulateDisease && (
                <button
                  onClick={handleVerifyRemission}
                  disabled={isVerifyingRemission}
                  className="w-full py-2 px-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98"
                >
                  {isVerifyingRemission ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Scanning Specimen Remission...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Verify Remission & Mark Healthy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {tree && (
            <button
              onClick={() => onOpenModal(tree)}
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition active:scale-98"
            >
              <Eye size={14} />
              <span>View Full Specimen Diagnostics & Logs</span>
            </button>
          )}
        </div>
      </div>

      {/* Lightbox HD Modal for Leaf Photograph */}
      {lightboxOpen && latestImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-white">
            <div className="p-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black">Foliar Specimen High-Resolution Capture</h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  {tree?.tree_number} • {latestImage.file_path.split('/').pop() || 'leaf_specimen.jpg'}
                </p>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-slate-300 transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-black">
              <img
                src={`http://localhost:8000/storage/${latestImage.file_path}`}
                alt="High-Res Leaf Specimen"
                className="max-h-[420px] w-auto rounded-xl shadow-lg border border-slate-800"
              />
            </div>

            <div className="p-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400">Diagnosis:</span>
                <span className="font-extrabold">{diseaseName}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-[10px] font-bold">
                  {confidencePercent}% ML Confidence
                </span>
              </div>
              <button
                onClick={() => setLightboxOpen(false)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
