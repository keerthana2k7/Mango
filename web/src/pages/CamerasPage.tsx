import React from 'react';
import { Camera as CameraIcon } from 'lucide-react';
import { Camera } from '../types';

interface CamerasPageProps {
  cameras: Camera[];
}

export const CamerasPage: React.FC<CamerasPageProps> = ({ cameras }) => {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Camera & Hardware Devices</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Overhead rail camera rigs, ESP32 telemetry, and physical motor drivers.
          </p>
        </div>
      </div>

      {/* Camera Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((cam) => {
          const isOnline = cam.status !== 'OFFLINE' && cam.status !== 'ERROR';
          return (
            <div key={cam.id} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <CameraIcon size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                    isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    ● {cam.status}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 mb-1">{cam.name}</h3>
                <p className="text-xs text-slate-400 font-medium mb-5">{cam.device_type}</p>

                {/* Telemetry stats */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Current Grid Position</span>
                    <span className="font-bold text-slate-900">Row {cam.current_row}, Col {cam.current_column}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Rail Traversal Speed</span>
                    <span className="font-bold text-emerald-700">{cam.speed_m_per_s} m/s</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Battery Level</span>
                    <span className="font-bold text-slate-900">{cam.battery_percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Linear Position</span>
                    <span className="font-bold text-slate-900">{cam.rail_position_meters} m</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400">Hardware Layer: Active</span>
                <span className="text-emerald-700 font-bold">ESP32 Ready</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
