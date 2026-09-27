import React from 'react';
import { Activity, Clock, ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { FarmAnalyticsSummary } from '../../types';

interface RecentActivityFeedProps {
  analytics: FarmAnalyticsSummary | null;
  onSelectTreeNumber: (treeNumber: string) => void;
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ analytics, onSelectTreeNumber }) => {
  const activities = analytics?.recent_activity || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Recent Diagnostic Activity</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Stream</span>
        </div>
        <p className="text-xs text-slate-400 font-medium mb-4">Real-time ML leaf scans from overhead rail camera</p>

        {/* Activity List */}
        <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
          {activities.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-slate-400">
              No recent inspections recorded yet. Start simulation to begin scouting.
            </div>
          ) : (
            activities.map((act) => {
              const isHealthy = act.disease_name.toLowerCase() === 'healthy';
              const formattedTime = new Date(act.prediction_time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={act.id}
                  onClick={() => onSelectTreeNumber(act.tree_number)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-2xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm ${
                      isHealthy ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isHealthy ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900">{act.tree_number}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isHealthy ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {act.disease_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                        <Clock size={11} />
                        <span>{formattedTime}</span>
                        <span>•</span>
                        <span>Confidence: {Math.round(act.confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-600 transition" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
