import React, { useEffect, useState } from 'react';
import { X, Image as ImageIcon, Sparkles, Pill, Plus, CheckCircle2, History } from 'lucide-react';
import { Tree, ImageRecord, PredictionRecord, TreatmentRecord } from '../../types';
import { api } from '../../services/api';

interface TreeDetailModalProps {
  tree: Tree | null;
  onClose: () => void;
  onTreeUpdated?: () => void;
}

export const TreeDetailModal: React.FC<TreeDetailModalProps> = ({ tree, onClose, onTreeUpdated }) => {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [treatments, setTreatments] = useState<TreatmentRecord[]>([]);
  
  // Treatment form state
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [chemicalName, setChemicalName] = useState('');
  const [dosage, setDosage] = useState('');
  const [treatmentType, setTreatmentType] = useState<'CHEMICAL' | 'ORGANIC' | 'PRUNING'>('CHEMICAL');
  const [operatorName, setOperatorName] = useState('Senior Orchardist');
  const [notes, setNotes] = useState('');
  const [isSubmittingTreatment, setIsSubmittingTreatment] = useState(false);
  const [currentHealthStatus, setCurrentHealthStatus] = useState<string>(tree?.health_status || 'UNKNOWN');

  const loadData = (treeId: number) => {
    Promise.all([
      api.getTreeImages(treeId).catch(() => []),
      api.getTreePredictions(treeId).catch(() => []),
      api.getTreeTreatments(treeId).catch(() => [])
    ]).then(([imgRes, predRes, treatRes]) => {
      setImages(imgRes);
      setPredictions(predRes);
      setTreatments(treatRes);
    });
  };

  useEffect(() => {
    if (!tree) return;
    setCurrentHealthStatus(tree.health_status);
    loadData(tree.id);
  }, [tree]);

  if (!tree) return null;

  const isHealthy = currentHealthStatus === 'HEALTHY';
  const isDiseased = currentHealthStatus === 'DISEASE_DETECTED';
  const isTreated = currentHealthStatus === 'TREATED';

  const latestPred = predictions[0] || (tree.latest_prediction ? {
    disease_name: tree.latest_prediction.disease_name,
    confidence: tree.latest_prediction.confidence,
    symptoms: 'Foliar diagnostic recorded during automated rail inspection.',
    treatment_recommendation: 'Follow standard orchard fungicide schedule.',
    prediction_time: tree.latest_prediction.prediction_time,
    model_version: 'v1.2.0'
  } : null);

  const handleSubmitTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chemicalName.trim()) return;

    setIsSubmittingTreatment(true);
    try {
      await api.logTreatment({
        tree_id: tree.id,
        chemical_name: chemicalName.trim(),
        dosage: dosage.trim() || undefined,
        treatment_type: treatmentType,
        operator_name: operatorName.trim() || undefined,
        notes: notes.trim() || undefined,
        update_tree_health: true,
        new_health_status: 'TREATED'
      });

      setCurrentHealthStatus('TREATED');
      setShowTreatmentForm(false);
      setChemicalName('');
      setDosage('');
      setNotes('');
      loadData(tree.id);
      if (onTreeUpdated) onTreeUpdated();
    } catch (err) {
      console.error('Failed to log treatment:', err);
    } finally {
      setIsSubmittingTreatment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
              isHealthy
                ? 'bg-emerald-100 text-emerald-700'
                : isDiseased
                ? 'bg-rose-100 text-rose-700'
                : isTreated
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-400'
            }`}>
              🌳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Tree {tree.tree_number}</h3>
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full ${
                  isHealthy
                    ? 'bg-emerald-100 text-emerald-800'
                    : isDiseased
                    ? 'bg-rose-100 text-rose-800'
                    : isTreated
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {isHealthy
                    ? 'Healthy Specimen'
                    : isDiseased
                    ? 'Pathogen Detected'
                    : isTreated
                    ? 'Treated / In Recovery'
                    : 'Pending Inspection'}
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
              isHealthy ? 'bg-emerald-50/70 border-emerald-200' : isTreated ? 'bg-amber-50/70 border-amber-200' : 'bg-rose-50/70 border-rose-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className={isHealthy ? 'text-emerald-700' : isTreated ? 'text-amber-700' : 'text-rose-600'} />
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

          {/* Treatment & Intervention Log Section */}
          <div className="bg-slate-50/80 p-5 rounded-3xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                <Pill size={16} className="text-emerald-600" />
                <span>Intervention & Spray History ({treatments.length})</span>
              </div>

              <button
                type="button"
                onClick={() => setShowTreatmentForm(!showTreatmentForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Plus size={13} />
                <span>Log Spray Action</span>
              </button>
            </div>

            {/* Treatment Input Form */}
            {showTreatmentForm && (
              <form onSubmit={handleSubmitTreatment} className="mb-4 p-4 bg-white rounded-2xl border border-emerald-200 shadow-sm space-y-3">
                <div className="text-xs font-bold text-emerald-950">Record Agrochemical / Organic Spray</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Chemical / Product Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Copper Oxychloride 50 WP"
                      value={chemicalName}
                      onChange={(e) => setChemicalName(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 3.0 g / Litre"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Intervention Type</label>
                    <select
                      value={treatmentType}
                      onChange={(e) => setTreatmentType(e.target.value as any)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none bg-white"
                    >
                      <option value="CHEMICAL">Foliar Chemical Spray</option>
                      <option value="ORGANIC">Organic / Bio-control</option>
                      <option value="PRUNING">Sanitary Shoot Pruning</option>
                      <option value="BIOLOGICAL">Beneficial Insect Predator</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Operator Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mithilesh"
                      value={operatorName}
                      onChange={(e) => setOperatorName(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Agronomist Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Applied before heavy rains; canopy completely covered."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowTreatmentForm(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTreatment || !chemicalName.trim()}
                    className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmittingTreatment ? 'Recording...' : 'Record & Mark Treated'}
                  </button>
                </div>
              </form>
            )}

            {/* Treatment list */}
            {treatments.length === 0 ? (
              <div className="p-4 text-center text-xs font-medium text-slate-400">
                No past spray interventions recorded for this tree.
              </div>
            ) : (
              <div className="space-y-2">
                {treatments.map((t) => (
                  <div key={t.id} className="p-3 bg-white rounded-2xl border border-slate-200/80 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{t.chemical_name}</span>
                        {t.dosage && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {t.dosage}
                          </span>
                        )}
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
                          {t.treatment_type}
                        </span>
                      </div>
                      {t.notes && <p className="text-[11px] text-slate-600 mt-1">{t.notes}</p>}
                      <p className="text-[10px] text-slate-400 mt-0.5">Applied by {t.operator_name}</p>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400">
                      {new Date(t.treated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

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
