import React, { useState } from 'react';
import { Download, ShieldCheck, AlertTriangle, Pill, CheckCircle2 } from 'lucide-react';
import { FarmAnalyticsSummary } from '../types';
import { api } from '../services/api';

interface AnalyticsPageProps {
  analytics: FarmAnalyticsSummary | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics }) => {
  const [isExporting, setIsExporting] = useState(false);
  const breakdown = analytics?.disease_breakdown || [];

  const handleExportCsv = () => {
    setIsExporting(true);
    const url = api.getExportAuditCsvUrl(analytics?.farm_id);
    window.open(url, '_blank');
    setTimeout(() => setIsExporting(false), 1500);
  };

  const treatedCount = analytics?.health_distribution.treated_count || 0;
  const treatedPct = analytics?.health_distribution.treated_percentage || 0.0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Farm Health & Disease Analytics</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Detailed incidence rates, pathogen severity distributions, and treatment audit trails.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
        >
          <Download size={15} className={isExporting ? 'animate-bounce' : ''} />
          <span>Export Full Audit Report (CSV)</span>
        </button>
      </div>

      {/* Aggregate Health Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-card">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Healthy Canopy</span>
          </div>
          <div className="text-3xl font-black text-emerald-700">{analytics?.health_score || 75.0}%</div>
          <p className="text-xs text-slate-500 mt-2">Verified healthy specimens without active lesions.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-card">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <AlertTriangle size={14} className="text-rose-600" />
            <span>Active Infection</span>
          </div>
          <div className="text-3xl font-black text-rose-600">{analytics?.health_distribution.diseased_percentage || 16.7}%</div>
          <p className="text-xs text-slate-500 mt-2">Foliar pathogens detected across orchard rows.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-card">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <Pill size={14} className="text-teal-600" />
            <span>Treated / Recovery</span>
          </div>
          <div className="text-3xl font-black text-teal-700">{treatedPct}%</div>
          <p className="text-xs text-slate-500 mt-2">{treatedCount} trees treated with agrochemical sprays.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-card">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            <CheckCircle2 size={14} className="text-slate-700" />
            <span>Scouting Coverage</span>
          </div>
          <div className="text-3xl font-black text-slate-900">100%</div>
          <p className="text-xs text-slate-500 mt-2">All 24 trees mapped to overhead rail inspection.</p>
        </div>
      </div>

      {/* Disease Distribution Chart Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">Classified Pathogen Distribution</h3>
        <div className="space-y-4">
          {breakdown.length === 0 ? (
            <div className="py-8 text-center text-xs font-semibold text-slate-400">
              No pathogen distributions recorded. Run camera rail inspection to detect anomalies.
            </div>
          ) : (
            breakdown.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.severity === 'HIGH' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    <span className="text-slate-900 font-bold">{item.disease_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{item.percentage}% of infections</span>
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {item.count} {item.count === 1 ? 'tree' : 'trees'}
                    </span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${item.severity === 'HIGH' ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
