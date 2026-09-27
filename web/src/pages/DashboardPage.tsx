import React from 'react';
import { MetricCards } from '../components/dashboard/MetricCards';
import { LiveFarmMap } from '../components/farm/LiveFarmMap';
import { CameraTelemetryPanel } from '../components/farm/CameraTelemetryPanel';
import { LiveTreeInspectionCard } from '../components/farm/LiveTreeInspectionCard';
import { HealthGaugeCard } from '../components/dashboard/HealthGaugeCard';
import { DiseaseBreakdownCard } from '../components/dashboard/DiseaseBreakdownCard';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { Farm, Tree, SimulationStatus, FarmAnalyticsSummary, FarmLayout } from '../types';

interface DashboardPageProps {
  farm: Farm | null;
  layout?: FarmLayout | null;
  trees: Tree[];
  simulationStatus: SimulationStatus | null;
  analytics: FarmAnalyticsSummary | null;
  onStartSimulation: (speed: number) => void;
  onPauseSimulation: () => void;
  onStopSimulation: () => void;
  onResetSimulation: () => void;
  onStepSimulation: () => void;
  onSelectTree: (tree: Tree) => void;
  onSelectTreeNumber: (treeNumber: string) => void;
  onNavigateTab: (tab: string) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  farm,
  layout = null,
  trees,
  simulationStatus,
  analytics,
  onStartSimulation,
  onPauseSimulation,
  onStopSimulation,
  onResetSimulation,
  onStepSimulation,
  onSelectTree,
  onSelectTreeNumber,
  onNavigateTab,
  speed,
  onSpeedChange,
}) => {
  // Find current inspected tree for live inspection card
  const activeTreeId = simulationStatus?.current_tree_id;
  const inspectedTree = trees.find((t) => t.id === activeTreeId) || (trees.length > 0 ? trees[0] : null);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner / Greeting */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Good morning, Orchardist 👋
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Monitoring <span className="font-bold text-slate-800">{farm?.name || 'Salem Mango Orchard'}</span> • Overhead rail automated disease detection
          </p>
        </div>
      </div>

      {/* Top Metric Cards */}
      <MetricCards analytics={analytics} />

      {/* Main 65% Live Farm Map & 35% Telemetry / Inspection Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 65% Live Farm Map Section (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col">
          <LiveFarmMap
            layout={layout}
            trees={trees}
            simulationStatus={simulationStatus}
            onSelectTree={onSelectTree}
            selectedTreeId={activeTreeId}
          />
        </div>

        {/* 35% Sidebar: Camera Telemetry + Live Tree ML Diagnostic (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <CameraTelemetryPanel
            simulationStatus={simulationStatus}
            speed={speed}
            onSpeedChange={onSpeedChange}
            onStartSimulation={onStartSimulation}
            onPauseSimulation={onPauseSimulation}
            onStopSimulation={onStopSimulation}
            onResetSimulation={onResetSimulation}
            onStepSimulation={onStepSimulation}
          />

          <LiveTreeInspectionCard
            tree={inspectedTree}
            simulationStatus={simulationStatus}
            onOpenModal={onSelectTree}
          />
        </div>
      </div>

      {/* Analytics & Activity Row (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HealthGaugeCard analytics={analytics} onViewAnalytics={() => onNavigateTab('analytics')} />
        <DiseaseBreakdownCard analytics={analytics} />
        <RecentActivityFeed analytics={analytics} onSelectTreeNumber={onSelectTreeNumber} />
      </div>
    </div>
  );
};

