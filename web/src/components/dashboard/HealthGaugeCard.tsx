import React from 'react';
import { ArrowRight } from 'lucide-react';
import { FarmAnalyticsSummary } from '../../types';

interface HealthGaugeCardProps {
  analytics: FarmAnalyticsSummary | null;
  onViewAnalytics: () => void;
}

export const HealthGaugeCard: React.FC<HealthGaugeCardProps> = ({ analytics, onViewAnalytics }) => {
  const healthScore = analytics?.health_score || 75.0;
  const healthy = analytics?.health_distribution.healthy_count || 18;
  const diseased = analytics?.health_distribution.diseased_count || 4;
  const unknown = analytics?.health_distribution.unknown_count || 2;

  // Calculate SVG stroke offset for half-gauge (circumference = PI * r = 3.14159 * 70 = 220)
  const strokeDash = 220;
  const strokeOffset = strokeDash - (strokeDash * (healthScore / 100));

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Orchard Health Index</h3>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
          Season 2026
        </span>
      </div>

      {/* Half-Doughnut Gauge (Inspired by Reference 1 & 3) */}
      <div className="relative flex flex-col items-center justify-center my-4">
        <svg className="w-48 h-28 overflow-visible" viewBox="0 0 160 90">
          {/* Background Track */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Foreground Health Arc */}
          <path
            d="M 10 80 A 70 70 0 0 1 150 80"
            fill="none"
            stroke="url(#healthGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={strokeDash}
            strokeDashoffset={strokeOffset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute top-10 flex flex-col items-center">
          <span className="text-3xl font-black text-slate-900 tracking-tight">{healthScore}%</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Health Rating</span>
        </div>
      </div>

      {/* Mini Progress Bars */}
      <div className="space-y-2.5 my-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Healthy Foliage</span>
          <span className="font-bold text-emerald-700">{healthy} Trees ({analytics?.health_distribution.healthy_percentage || 75}%)</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${analytics?.health_distribution.healthy_percentage || 75}%` }} />
        </div>

        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Infection Rate</span>
          <span className="font-bold text-rose-600">{diseased} Trees ({analytics?.health_distribution.diseased_percentage || 16.7}%)</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-rose-500 rounded-full transition-all duration-500" style={{ width: `${analytics?.health_distribution.diseased_percentage || 16.7}%` }} />
        </div>
      </div>

      <button
        onClick={onViewAnalytics}
        className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl text-xs font-bold transition border border-slate-200/60"
      >
        <span>View Detailed Health Analytics</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
};
