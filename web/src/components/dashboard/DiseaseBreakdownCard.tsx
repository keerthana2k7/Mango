import React from 'react';
import { AlertCircle } from 'lucide-react';
import { FarmAnalyticsSummary, DiseaseCountItem } from '../../types';

interface DiseaseBreakdownCardProps {
  analytics: FarmAnalyticsSummary | null;
}

export const DiseaseBreakdownCard: React.FC<DiseaseBreakdownCardProps> = ({ analytics }) => {
  const breakdown: DiseaseCountItem[] = analytics?.disease_breakdown || [
    { disease_name: 'Anthracnose', count: 2, percentage: 50.0, severity: 'HIGH' },
    { disease_name: 'Powdery Mildew', count: 1, percentage: 25.0, severity: 'HIGH' },
    { disease_name: 'Gall Midge', count: 1, percentage: 25.0, severity: 'MEDIUM' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Active Disease Pathogens</h3>
          <span className="text-xs font-bold text-slate-400">Cases</span>
        </div>
        <p className="text-xs text-slate-400 font-medium mb-4">ML multi-class classification detections</p>

        {/* Disease Items List */}
        <div className="space-y-3.5">
          {breakdown.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-slate-400">
              No disease outbreaks detected in this orchard block.
            </div>
          ) : (
            breakdown.map((item, idx) => {
              const isHigh = item.severity === 'HIGH';
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      <span className="font-bold text-slate-800">{item.disease_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-normal">{item.percentage}%</span>
                      <span className="font-bold text-slate-800 px-2 py-0.5 rounded-lg bg-slate-100 text-[11px]">
                        {item.count} {item.count === 1 ? 'tree' : 'trees'}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-400">
        <div className="flex items-center gap-1.5 text-rose-600">
          <AlertCircle size={14} />
          <span>Fungicide Spray Recommendation Active</span>
        </div>
        <span>8 Classes Monitored</span>
      </div>
    </div>
  );
};
