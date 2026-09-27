import React from 'react';
import { Trees, ShieldCheck, AlertTriangle, Video, ArrowUpRight, TrendingUp } from 'lucide-react';
import { FarmAnalyticsSummary } from '../../types';

interface MetricCardsProps {
  analytics: FarmAnalyticsSummary | null;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ analytics }) => {
  const total = analytics?.total_trees || 24;
  const healthy = analytics?.health_distribution.healthy_count || 18;
  const diseased = analytics?.health_distribution.diseased_count || 4;
  const healthScore = analytics?.health_score || 75.0;
  const activeCams = analytics?.active_cameras || 1;

  const cards = [
    {
      title: 'Total Mango Trees',
      value: total.toString(),
      subtext: 'Across 4 Orchard Rows',
      icon: Trees,
      badge: '+4.2% yield est.',
      color: 'text-slate-900',
      bgIcon: 'bg-emerald-50 text-emerald-600',
      highlight: false,
    },
    {
      title: 'Healthy Trees',
      value: healthy.toString(),
      subtext: `${healthScore}% overall health score`,
      icon: ShieldCheck,
      badge: 'Optimal Condition',
      color: 'text-emerald-700',
      bgIcon: 'bg-emerald-100/60 text-emerald-700',
      highlight: true, // Primary highlight card like Reference 3
    },
    {
      title: 'Disease Detected',
      value: diseased.toString(),
      subtext: 'Requires treatment spray',
      icon: AlertTriangle,
      badge: `${analytics?.health_distribution.diseased_percentage || 16.7}% of orchard`,
      color: 'text-rose-600',
      bgIcon: 'bg-rose-50 text-rose-600',
      highlight: false,
    },
    {
      title: 'Active Rail Cameras',
      value: `${activeCams} Online`,
      subtext: 'Automated overhead track',
      icon: Video,
      badge: 'Telemetry 100%',
      color: 'text-slate-900',
      bgIcon: 'bg-blue-50 text-blue-600',
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        if (card.highlight) {
          return (
            <div
              key={idx}
              className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white p-5 rounded-3xl shadow-xl shadow-emerald-900/10 flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition duration-300"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">{card.title}</span>
                <div className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                  <ArrowUpRight size={16} />
                </div>
              </div>
              <div className="my-3">
                <div className="text-3xl font-extrabold tracking-tight">{card.value}</div>
                <p className="text-xs text-emerald-200/80 font-medium mt-1">{card.subtext}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 text-xs font-bold text-emerald-100 self-start">
                <TrendingUp size={13} />
                <span>{card.badge}</span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={idx}
            className="bg-white p-5 rounded-3xl border border-slate-200/70 shadow-card flex flex-col justify-between hover:border-slate-300 hover:shadow-float transition duration-300 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
              <div className={`w-9 h-9 rounded-2xl ${card.bgIcon} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <Icon size={18} />
              </div>
            </div>
            <div className="my-3">
              <div className={`text-3xl font-extrabold tracking-tight ${card.color}`}>{card.value}</div>
              <p className="text-xs text-slate-400 font-medium mt-1">{card.subtext}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600 self-start">
              <span>{card.badge}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
