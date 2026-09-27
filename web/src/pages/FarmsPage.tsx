import React from 'react';
import { MapPin } from 'lucide-react';
import { Farm, Tree } from '../types';

interface FarmsPageProps {
  farms: Farm[];
  trees: Tree[];
  onSelectTree: (tree: Tree) => void;
}

export const FarmsPage: React.FC<FarmsPageProps> = ({ farms, trees, onSelectTree }) => {

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Farms & Tree Grid</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Manage orchard parcels, row dimensions, tree varieties, and health profiles.
          </p>
        </div>
      </div>

      {/* Farms List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {farms.map((f) => (
          <div key={f.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                  Commercial Parcel
                </span>
                <span className="text-xs font-semibold text-slate-400">{f.area_acres} Acres</span>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">{f.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-4">
                <MapPin size={14} className="text-slate-400" />
                <span>{f.location}</span>
              </div>
              <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                {f.description || 'High density mango cultivation parcel equipped with automated scouting rail carriage.'}
              </p>

              {/* Grid Metrics */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grid Rows</span>
                  <span className="text-sm font-black text-slate-900">{f.total_rows} Rows</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trees/Row</span>
                  <span className="text-sm font-black text-slate-900">{f.trees_per_row} Trees</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Stand</span>
                  <span className="text-sm font-black text-emerald-700">{f.total_rows * f.trees_per_row} Trees</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold text-slate-500">
              <span>Healthy: {f.healthy_trees || 18} • Diseased: {f.diseased_trees || 4}</span>
              <span className="text-emerald-700 font-bold">Overhead Rail Ready</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tree Grid Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Full Tree Inventory</h3>
          <span className="text-xs font-bold text-slate-400">{trees.length} Mango Trees Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Tree Number</th>
                <th className="py-3 px-4">Grid Position</th>
                <th className="py-3 px-4">Variety</th>
                <th className="py-3 px-4">Health Status</th>
                <th className="py-3 px-4">Latest Diagnosis</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {trees.map((t) => {
                const isHealthy = t.health_status === 'HEALTHY';
                const isDiseased = t.health_status === 'DISEASE_DETECTED';
                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span>🌳</span>
                      <span>{t.tree_number}</span>
                    </td>
                    <td className="py-3.5 px-4">Row {t.row_number}, Col {t.column_number}</td>
                    <td className="py-3.5 px-4">{t.variety}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isHealthy ? 'bg-emerald-100 text-emerald-800' : isDiseased ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isHealthy ? 'Healthy' : isDiseased ? 'Disease Detected' : 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {t.latest_prediction ? (
                        <span className="font-semibold text-slate-900">
                          {t.latest_prediction.disease_name} ({Math.round(t.latest_prediction.confidence * 100)}%)
                        </span>
                      ) : (
                        <span className="text-slate-400">No scan recorded</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectTree(t)}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
