import React, { useState, useEffect } from 'react';
import { BookOpen, Activity, Search, ShieldAlert, Sparkles, Pill, AlertTriangle } from 'lucide-react';
import { PredictionRecord, DiseaseAdvisory } from '../types';
import { api } from '../services/api';

interface PredictionsPageProps {
  predictions: PredictionRecord[];
  onSelectTreeNumber: (treeNumber: string) => void;
}

export const PredictionsPage: React.FC<PredictionsPageProps> = ({ predictions, onSelectTreeNumber }) => {
  const [activeTab, setActiveTab] = useState<'PREDICTIONS' | 'GUIDE'>('PREDICTIONS');
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [advisories, setAdvisories] = useState<DiseaseAdvisory[]>([]);
  const [advisorySearch, setAdvisorySearch] = useState('');

  useEffect(() => {
    api.getAdvisories().then(setAdvisories).catch(() => {});
  }, []);

  const filteredPredictions = predictions.filter((p) => {
    const matchesFilter =
      filter === 'ALL'
        ? true
        : filter === 'HEALTHY'
        ? p.disease_name.toLowerCase() === 'healthy'
        : p.disease_name.toLowerCase() !== 'healthy';
    const matchesSearch = p.disease_name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const filteredAdvisories = advisories.filter((a) =>
    a.name.toLowerCase().includes(advisorySearch.toLowerCase()) ||
    a.scientific_name.toLowerCase().includes(advisorySearch.toLowerCase()) ||
    a.symptoms.toLowerCase().includes(advisorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Disease Diagnostics & Treatment Hub</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Historical ML classifications, confidence distributions, and agronomic disease management protocols.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 text-xs font-bold">
          <button
            onClick={() => setActiveTab('PREDICTIONS')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'PREDICTIONS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity size={14} />
            <span>AI Predictions ({predictions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('GUIDE')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition ${
              activeTab === 'GUIDE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={14} />
            <span>Disease Guide ({advisories.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'PREDICTIONS' ? (
        <>
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Filter predictions by disease..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

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
                  {filteredPredictions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No prediction records match the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPredictions.map((p) => {
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
        </>
      ) : (
        /* Agronomic Disease Guide Section */
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search disease symptoms or treatments..."
                value={advisorySearch}
                onChange={(e) => setAdvisorySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <span className="text-xs font-bold text-slate-400">
              Showing {filteredAdvisories.length} official foliar disease profiles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAdvisories.map((adv) => {
              const isHealthy = adv.name.toLowerCase() === 'healthy';
              const isHigh = adv.severity === 'HIGH';
              return (
                <div
                  key={adv.class_id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-6 flex flex-col justify-between hover:shadow-lg transition duration-200"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900">{adv.name}</h3>
                        <p className="text-xs italic text-slate-400 font-serif">{adv.scientific_name}</p>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          isHealthy
                            ? 'bg-emerald-100 text-emerald-800'
                            : isHigh
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {adv.severity} Severity
                      </span>
                    </div>

                    {/* Symptoms */}
                    <div className="mb-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1">
                        <AlertTriangle size={14} className={isHealthy ? 'text-emerald-600' : 'text-amber-500'} />
                        <span>Visual Foliar Symptoms</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{adv.symptoms}</p>
                    </div>

                    {/* Treatment */}
                    <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 mb-1">
                        <Pill size={14} className="text-emerald-700" />
                        <span>Recommended Prescription / Spray</span>
                      </div>
                      <p className="text-xs text-emerald-900 leading-relaxed font-medium">{adv.treatment}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span>Class ID: #{adv.class_id}</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <Sparkles size={12} />
                      AI Verified Standard
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
