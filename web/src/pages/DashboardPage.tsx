import React, { useState } from 'react';
import {
  Sparkles,
  CloudRain,
  Thermometer,
  Droplets,
  Wind,
  ShieldAlert,
  Zap,
  FileText,
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  Pill,
} from 'lucide-react';
import { MetricCards } from '../components/dashboard/MetricCards';
import { LiveFarmMap } from '../components/farm/LiveFarmMap';
import { CameraTelemetryPanel } from '../components/farm/CameraTelemetryPanel';
import { LiveTreeInspectionCard } from '../components/farm/LiveTreeInspectionCard';
import { HealthGaugeCard } from '../components/dashboard/HealthGaugeCard';
import { DiseaseBreakdownCard } from '../components/dashboard/DiseaseBreakdownCard';
import { RecentActivityFeed } from '../components/dashboard/RecentActivityFeed';
import { Farm, Tree, SimulationStatus, FarmAnalyticsSummary, FarmLayout } from '../types';
import { api } from '../services/api';

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
  onSimulateDisease?: (diseaseName: string, severity?: string, treeId?: number) => Promise<any>;
  onTreeUpdated?: () => void;
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
  onSimulateDisease,
  onTreeUpdated,
}) => {
  const [filterHealth, setFilterHealth] = useState<'ALL' | 'HEALTHY' | 'DISEASE_DETECTED' | 'TREATED' | null>('ALL');
  const [focusedTreeId, setFocusedTreeId] = useState<number | null>(null);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState<boolean>(false);
  const [isBatchTreating, setIsBatchTreating] = useState<boolean>(false);
  const [batchSuccessMessage, setBatchSuccessMessage] = useState<string | null>(null);

  // Active tree resolution: Follow active gantry during movement, otherwise user's selected tree
  const activeTreeId = simulationStatus?.current_tree_id;
  const isSimActive = simulationStatus?.status === 'MOVING' || simulationStatus?.status === 'CAPTURING';
  const displayedTreeId = (isSimActive && activeTreeId) ? activeTreeId : (focusedTreeId || activeTreeId || (trees.length > 0 ? trees[0]?.id : null));
  const inspectedTree = trees.find((t) => t.id === displayedTreeId) || (trees.length > 0 ? trees[0] : null);

  const diseasedTrees = trees.filter((t) => t.health_status === 'DISEASE_DETECTED');

  const handleSelectDisease = (diseaseName: string) => {
    const targetTree = trees.find(
      (t) =>
        t.latest_prediction?.disease_name.toLowerCase() === diseaseName.toLowerCase() ||
        (diseaseName.toLowerCase().includes('anthracnose') && t.health_status === 'DISEASE_DETECTED')
    );
    if (targetTree) {
      setFocusedTreeId(targetTree.id);
    }
    setFilterHealth('DISEASE_DETECTED');
  };

  const handleMapSelectTree = (tree: Tree) => {
    setFocusedTreeId(tree.id);
  };

  const handleFeedSelectTree = (treeNumber: string) => {
    const target = trees.find((t) => t.tree_number === treeNumber);
    if (target) {
      setFocusedTreeId(target.id);
    }
    if (onSelectTreeNumber) onSelectTreeNumber(treeNumber);
  };

  // Batch Spray Remediation for all diseased trees
  const handleBatchTreat = async () => {
    if (diseasedTrees.length === 0) return;
    setIsBatchTreating(true);
    setBatchSuccessMessage(null);
    try {
      const res = await api.batchTreatTrees({
        farm_id: farm?.id || 1,
        chemical_name: 'Copper Oxychloride 50 WP',
        dosage: '3.0 g / Litre',
        operator_name: 'Orchard Gantry Automation',
        notes: 'Targeted high-pressure canopy spray across all detected foliar lesions',
        target_health_status: 'DISEASE_DETECTED',
      });
      setBatchSuccessMessage(res.message || `Treated ${res.treated_count} trees successfully.`);
      if (onTreeUpdated) onTreeUpdated();
      setTimeout(() => setBatchSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error('Batch treat failed:', err);
      setBatchSuccessMessage('Failed to execute batch spray. Please check network.');
    } finally {
      setIsBatchTreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner & Microclimate Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Salem Heritage Mango Orchard
            </h2>
            <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              Autonomous Scout Active
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Parcel: <span className="font-bold text-slate-800">{farm?.name || 'Salem Mango Orchard'}</span> (4 Rows • 24 Trees • 4K-NIR Foliar Analysis)
          </p>
        </div>

        {/* Action Controls: Batch Treat & Work Order */}
        <div className="flex items-center gap-2.5">
          {diseasedTrees.length > 0 && (
            <button
              onClick={handleBatchTreat}
              disabled={isBatchTreating}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white text-xs font-extrabold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {isBatchTreating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Spraying {diseasedTrees.length} Trees...</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Spray All Infected ({diseasedTrees.length})</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={() => setShowWorkOrderModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition active:scale-95"
          >
            <FileText size={14} className="text-emerald-700" />
            <span>Spray Work Order</span>
          </button>
        </div>
      </div>

      {/* Batch Remediation Toast */}
      {batchSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{batchSuccessMessage}</span>
          </div>
          <button
            onClick={() => setBatchSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Orchard Microclimate & Foliar Infection Risk Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6 divide-x divide-slate-100 overflow-x-auto text-xs">
            {/* Ambient Temperature */}
            <div className="flex items-center gap-2.5 pr-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Thermometer size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Canopy Temp</span>
                <span className="font-extrabold text-slate-900">28.4°C</span>
              </div>
            </div>

            {/* Relative Humidity */}
            <div className="flex items-center gap-2.5 px-4">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Droplets size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Canopy RH</span>
                <span className="font-extrabold text-slate-900">78% (Elevated)</span>
              </div>
            </div>

            {/* Leaf Wetness */}
            <div className="flex items-center gap-2.5 px-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CloudRain size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Leaf Wetness</span>
                <span className="font-extrabold text-slate-900">64% Saturation</span>
              </div>
            </div>

            {/* Wind Speed */}
            <div className="flex items-center gap-2.5 px-4">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Wind size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Wind Drift</span>
                <span className="font-extrabold text-slate-900">7.2 km/h NW</span>
              </div>
            </div>
          </div>

          {/* Pathogen Risk Meter */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Anthracnose Spore Risk</span>
              <span className="text-xs font-black text-rose-600 flex items-center gap-1 justify-end">
                <ShieldAlert size={13} />
                <span>HIGH (RH &gt; 75%)</span>
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold">
              Spray Window: Next 3h 40m Safe
            </div>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <MetricCards
        analytics={analytics}
        selectedFilter={filterHealth}
        onSelectFilter={setFilterHealth}
        onNavigateTab={onNavigateTab}
      />

      {/* Main 65% Live Farm Map & 35% Telemetry / Inspection Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 65% Live Farm Map Section (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col">
          <LiveFarmMap
            layout={layout}
            trees={trees}
            simulationStatus={simulationStatus}
            onSelectTree={handleMapSelectTree}
            selectedTreeId={displayedTreeId}
            filterHealth={filterHealth}
            onFilterHealthChange={setFilterHealth}
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
            onSimulateDisease={onSimulateDisease}
          />

          <LiveTreeInspectionCard
            tree={inspectedTree}
            simulationStatus={simulationStatus}
            onOpenModal={onSelectTree}
            onTreeUpdated={onTreeUpdated}
            onSimulateDisease={onSimulateDisease}
          />
        </div>
      </div>

      {/* Analytics & Activity Row (3 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HealthGaugeCard analytics={analytics} onViewAnalytics={() => onNavigateTab('analytics')} />
        <DiseaseBreakdownCard analytics={analytics} onSelectDisease={handleSelectDisease} />
        <RecentActivityFeed analytics={analytics} onSelectTreeNumber={handleFeedSelectTree} />
      </div>

      {/* Printable Field Spray Work Order Modal */}
      {showWorkOrderModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Orchard Spray Prescription & Work Order</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Salem Mango Orchard • Automated agronomic prescription for field operators
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowWorkOrderModal(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="my-4 max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Stands</span>
                  <span className="font-extrabold text-slate-900">{trees.length} Trees</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Requiring Treatment</span>
                  <span className="font-extrabold text-rose-600">{diseasedTrees.length} Trees Detected</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Protective Treated</span>
                  <span className="font-extrabold text-teal-700">
                    {trees.filter((t) => t.health_status === 'TREATED').length} Trees
                  </span>
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Tree #</th>
                    <th className="py-2.5 px-3">Row:Col</th>
                    <th className="py-2.5 px-3">Target Pathogen</th>
                    <th className="py-2.5 px-3">Prescribed Chemical & Dosage</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {diseasedTrees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-semibold">
                        No trees currently require curative chemical spray.
                      </td>
                    </tr>
                  ) : (
                    diseasedTrees.map((tree) => {
                      const disease = tree.latest_prediction?.disease_name || 'Anthracnose';
                      const chemical = tree.latest_prediction?.treatment?.split('.')[0] || 'Copper Oxychloride 50 WP (3g/L)';
                      return (
                        <tr key={tree.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-slate-900">{tree.tree_number}</td>
                          <td className="py-3 px-3">Row {tree.row_number} : Col {tree.column_number}</td>
                          <td className="py-3 px-3 font-semibold text-rose-600">{disease}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{chemical}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              PENDING SPRAY
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <span className="font-extrabold block">Agronomist Safety Protocol (CIB&RC Standards):</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Operators must wear full personal protective equipment (PPE): chemical-resistant nitrile gloves, eye goggles, and N95 vapor respirator. Observe 14-day pre-harvest interval (PHI) before fruit picking.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">
                Generated by MangoVision Autonomous Scouting System
              </span>
              <button
                onClick={() => setShowWorkOrderModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition"
              >
                Close Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


