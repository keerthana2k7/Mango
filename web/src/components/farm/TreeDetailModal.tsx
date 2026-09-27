import React, { useEffect, useState } from 'react';
import { X, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Tree, ImageRecord, PredictionRecord } from '../../types';
import { api } from '../../services/api';

interface TreeDetailModalProps {
  tree: Tree | null;
  onClose: () => void;
}

export const TreeDetailModal: React.FC<TreeDetailModalProps> = ({ tree, onClose }) => {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);

  useEffect(() => {
    if (!tree) return;
    Promise.all([
      api.getTreeImages(tree.id).catch(() => []),
      api.getTreePredictions(tree.id).catch(() => [])
    ]).then(([imgRes, predRes]) => {
      setImages(imgRes);
      setPredictions(predRes);
    });
  }, [tree]);

  if (!tree) return null;

  const isHealthy = tree.health_status === 'HEALTHY';
  const isDiseased = tree.health_status === 'DISEASE_DETECTED';
  const latestPred = predictions[0] || (tree.latest_prediction ? {
    disease_name: tree.latest_prediction.disease_name,
    confidence: tree.latest_prediction.confidence,
    symptoms: 'Foliar diagnostic recorded during automated rail inspection.',
    treatment_recommendation: 'Follow standard orchard fungicide schedule.',
    prediction_time: tree.latest_prediction.prediction_time,
    model_version: 'v1.2.0'
  } : null);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
              isHealthy ? 'bg-emerald-100 text-emerald-700' : isDiseased ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'
            }`}>
              🌳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Tree {tree.tree_number}</h3>
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                  isHealthy ? 'bg-emerald-100 text-emerald-800' : isDiseased ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isHealthy ? 'Healthy Specimen' : isDiseased ? 'Pathogen Detected' : 'Pending Inspection'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Row 0{tree.row_number} • Column 0{tree.column_number} • Variety: {tree.variety}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Tree Detail"
            className="p-2 rounded-2xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Latest ML Diagnostic Card */}
          {latestPred ? (
            <div className={`p-5 rounded-3xl border ${
              isHealthy ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className={isHealthy ? 'text-emerald-700' : 'text-rose-600'} />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Latest AI Diagnostic Result
                  </span>
                </div>
                <span className="text-xs font-bold bg-white px-2.5 py-1 rounded-xl shadow-sm text-slate-700">
                  {Math.round(latestPred.confidence * 100)}% Confidence
                </span>
              </div>

              <div className="text-2xl font-black text-slate-900 mb-1">{latestPred.disease_name}</div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                {latestPred.symptoms || 'Visual inspection verified no active fungal or bacterial spots.'}
              </p>

              {latestPred.treatment_recommendation && (
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-extrabold text-slate-900 block uppercase tracking-wider mb-1">
                    Agronomic Recommendation / Treatment
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {latestPred.treatment_recommendation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-xs font-medium text-slate-400">No ML diagnostics recorded yet for this tree.</p>
            </div>
          )}

          {/* Captured Leaf Images */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                <ImageIcon size={16} className="text-slate-400" />
                <span>Captured Leaf Scans ({images.length})</span>
              </div>
            </div>

            {images.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-400">
                No leaf photos recorded yet. Run the rail camera to capture imagery.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square">
                    <img
                      src={`http://localhost:8000/storage/${img.file_path}`}
                      alt="Leaf Scan"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        // Fallback placeholder
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                      <span className="text-[10px] font-bold text-white">
                        {new Date(img.capture_time).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition shadow-sm"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
