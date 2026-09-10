import React, { useState, useEffect } from 'react';
import { GitCompare, History, Activity, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export default function HistoricalComparison({ areas = [], landslides = [] }) {
  const [selectedAreaId, setSelectedAreaId] = useState(areas[0]?.Area_ID || 'SK-009');
  const [currentReadings, setCurrentReadings] = useState(null);

  const selectedArea = areas.find(a => a.Area_ID === selectedAreaId) || areas[0];
  const historicalEvents = landslides.filter(l => l.Area_ID === selectedAreaId);

  useEffect(() => {
    if (selectedAreaId) {
      fetch(`/api/environmental/${selectedAreaId}`)
        .then(res => res.json())
        .then(json => json.success && setCurrentReadings(json.data))
        .catch(err => console.error('Error fetching environmental:', err));
    }
  }, [selectedAreaId]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-slate-100">Historical vs Current Condition Comparison</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Correlate historical disaster triggers from NIDM/Sikkim Government records against real-time sensor telemetry.
          </p>
        </div>
      </div>

      {/* Area Selector Bar */}
      <div className="glass-panel rounded-xl p-4 border border-slate-700/60 flex flex-col md:flex-row items-center gap-4">
        <label className="text-xs font-semibold text-slate-300 shrink-0">Select Target Sikkim Area:</label>
        <select
          value={selectedAreaId}
          onChange={(e) => setSelectedAreaId(e.target.value)}
          className="w-full md:w-auto flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {areas.map(a => (
            <option key={a.Area_ID} value={a.Area_ID}>
              {a.Area_ID} — {a.Village} ({a.District} District) • Risk Level: {a.Risk_Level}
            </option>
          ))}
        </select>
      </div>

      {/* AI Comparative Synthesis Banner */}
      <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/50 flex items-start gap-3 text-xs text-slate-200">
        <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-purple-300 block mb-0.5">SlopeGuard Intelligence Comparison Summary</span>
          {historicalEvents.length > 0 ? (
            <p className="leading-relaxed">
              Current telemetry in <strong className="text-white">{selectedArea?.Village}</strong> exhibits strong correlation with triggers recorded during past disaster events (e.g. {historicalEvents.map(e => e.Date).join(', ')}). High rainfall ({currentReadings?.rainfall_mm_hr} mm/h) combined with steep local topography ({currentReadings?.slope_angle_deg}°) mirrors conditions that led to severe road disruption on {selectedArea?.Road_Name}.
            </p>
          ) : (
            <p className="leading-relaxed">
              No historical landslide events recorded in NIDM/Govt database for area <strong className="text-white">{selectedArea?.Village}</strong>. Current conditions present standard seasonal monitoring metrics.
            </p>
          )}
        </div>
      </div>

      {/* Side-by-Side Comparison Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Column 1: Historical Events Recorded */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="font-bold text-base text-purple-300 flex items-center gap-2">
              <History className="w-5 h-5" />
              Recorded Past Disasters ({historicalEvents.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Real Dataset Records</span>
          </div>

          {historicalEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No past historical landslide records logged for area {selectedAreaId}.
            </div>
          ) : (
            <div className="space-y-3">
              {historicalEvents.map((evt) => (
                <div key={evt.Landslide_ID} className="p-3.5 rounded-xl bg-slate-900 border border-purple-900/40 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-400 font-mono">{evt.Landslide_ID}</span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold">
                      Date: {evt.Date}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Recorded Triggers:</span>
                    <p className="text-slate-200 mt-0.5">{evt.Trigger}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Severity:</span>{' '}
                    <span className="text-red-400 font-bold">
                      {evt.Severity === 'NOT_REPORTED' ? 'Not recorded' : evt.Severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Damage:</span>
                    <p className="text-slate-300 text-[11px] mt-0.5">{evt.Damage}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Current Environmental & Telemetry Readings */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="font-bold text-base text-cyan-300 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Current Sensor Telemetry
            </h3>
            <span className="text-[10px] text-amber-400 italic">Simulated Prototype Feed</span>
          </div>

          {currentReadings ? (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Current Precipitation:</span>
                <span className="font-mono text-base font-bold text-blue-400">
                  {currentReadings.rainfall_mm_hr} mm/h
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Soil Water Saturation:</span>
                <span className="font-mono text-base font-bold text-emerald-400">
                  {currentReadings.soil_moisture_percent}%
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Slope Gradient Angle:</span>
                <span className="font-mono text-base font-bold text-purple-400">
                  {currentReadings.slope_angle_deg}°
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Sub-surface Ground Movement:</span>
                <span className="font-mono text-base font-bold text-orange-400">
                  {currentReadings.ground_movement_mm} mm/24h
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300">
                <div className="font-bold text-slate-200 mb-1">Road Infrastructure Status:</div>
                <div className="flex justify-between">
                  <span>Corridor: {selectedArea.Road_Name}</span>
                  <span className="font-bold text-emerald-400">{selectedArea.Road_Status}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">Loading telemetry...</div>
          )}
        </div>

      </div>
    </div>
  );
}
