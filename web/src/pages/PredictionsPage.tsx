import React, { useState } from 'react';
import { PredictionRecord } from '../types';

interface PredictionsPageProps {
  predictions: PredictionRecord[];
  onSelectTreeNumber: (treeNumber: string) => void;
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({ predictions, onSelectTreeNumber }) => {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = predictions.filter((p) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'HEALTHY'
        ? p.disease_name.toLowerCase() === 'healthy'
        : p.disease_name.toLowerCase() !== 'healthy';
    const matchesSearch = p.disease_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Disease Prediction Records</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Historical ML classifications, confidence distributions, and agronomic prescriptions.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 text-xs font-bold">
          {['ALL', 'DISEASED', 'HEALTHY'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Predictions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Tree ID</th>
                <th className="py-3 px-4">Disease Classification</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Model Version</th>
                <th className="py-3 px-4">Agronomic Symptoms & Treatment</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No prediction records match the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isHealthy = p.disease_name.toLowerCase() === 'healthy';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        Tree #{p.tree_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.disease_name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {Math.round(p.confidence * 100)}%
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {p.model_version} {p.is_mock && <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold">MOCK</span>}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                        {p.treatment_recommendation || p.symptoms || 'None'}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-400 font-medium whitespace-nowrap">
                        {new Date(p.prediction_time).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
