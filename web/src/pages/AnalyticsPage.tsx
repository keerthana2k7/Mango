import React from 'react';
import { FarmAnalyticsSummary } from '../types';

interface AnalyticsPageProps {
  analytics: FarmAnalyticsSummary | null;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ analytics }) => {
  const breakdown = analytics?.disease_breakdown || [];

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Farm Health & Disease Analytics</h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Detailed incidence rates, pathogen severity distributions, and treatment timelines.
        </p>
      </div>

      {/* Aggregate Health Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Foliar Health Score</span>
          <div className="text-4xl font-black text-emerald-700">{analytics?.health_score || 75.0}%</div>
          <p className="text-xs text-slate-500 mt-2">Calculated from verified healthy mango tree specimens.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Infection Prevalence</span>
          <div className="text-4xl font-black text-rose-600">{analytics?.health_distribution.diseased_percentage || 16.7}%</div>
          <p className="text-xs text-slate-500 mt-2">Active pathogen detections identified across orchard rows.</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Scouting Coverage</span>
          <div className="text-4xl font-black text-slate-900">100%</div>
          <p className="text-xs text-slate-500 mt-2">All 24 trees mapped to overhead rail inspection track.</p>
        </div>
      </div>

      {/* Disease Distribution Chart Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card p-6">
        <h3 className="text-base font-extrabold text-slate-900 mb-4">Classified Pathogen Distribution</h3>
        <div className="space-y-4">
          {breakdown.map((item, idx) => (
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
          ))}
        </div>
      </div>
    </div>
  );
};
