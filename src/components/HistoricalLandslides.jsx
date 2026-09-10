import React, { useState } from 'react';
import { History, Tag, AlertOctagon, ExternalLink, Calendar, MapPin, Layers, Plus, Edit2, Trash2 } from 'lucide-react';

export default function HistoricalLandslides({ 
  landslides = [], 
  areas = [], 
  userRole, 
  onAddLandslide, 
  onUpdateLandslide, 
  onDeleteLandslide 
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingLandslide, setEditingLandslide] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const isAdmin = userRole === 'admin';

  const handleOpenAddModal = () => {
    const defaultArea = areas[0] || { Area_ID: 'SK-001', Village: 'Gangtok', Road_Name: 'NH-10' };
    setEditingLandslide({
      Landslide_ID: `LS-SK-${(landslides.length + 1).toString().padStart(3, '0')}`,
      Area_ID: defaultArea.Area_ID,
      Date: new Date().toISOString().split('T')[0],
      Village: defaultArea.Village,
      Road_Name: defaultArea.Road_Name,
      Severity: 'HIGH',
      Trigger: 'Heavy Monsoonal Precipitation',
      Damage: 'Road Blockage; Debris Slump',
      Source: 'State Disaster Management Authority Bulletin',
      Latitude: 'NOT_REPORTED',
      Longitude: 'NOT_REPORTED'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (ls, e) => {
    e.stopPropagation();
    setEditingLandslide({ ...ls });
    setShowModal(true);
  };

  const handleDelete = (lsId, e) => {
    e.stopPropagation();
    if (!isAdmin) return;
    onDeleteLandslide && onDeleteLandslide(lsId);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!isAdmin || !editingLandslide) return;

    const exists = landslides.some(l => l.Landslide_ID === editingLandslide.Landslide_ID);
    if (exists) {
      onUpdateLandslide && onUpdateLandslide(editingLandslide);
    } else {
      onAddLandslide && onAddLandslide(editingLandslide);
    }
    setShowModal(false);
  };

  // Helper to split semicolon separated text into clean array of tags
  const renderTags = (textStr, colorClass = 'bg-slate-800 text-slate-300 border-slate-700') => {
    if (!textStr || textStr === 'NOT_REPORTED') return <span className="text-slate-500 italic">Not recorded</span>;
    const parts = textStr.split(';').map(s => s.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1.5">
        {parts.map((p, idx) => (
          <span key={idx} className={`px-2 py-0.5 rounded text-[11px] font-medium border ${colorClass}`}>
            {p}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-slate-100">Historical Landslide Records (Sikkim 1957–2026)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official records loaded from <code className="text-purple-400 font-mono">sikkim_landslide_history.csv</code> (NIDM Historical Database & Sikkim Government Press Releases).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/50 text-purple-300 text-xs font-mono">
            {landslides.length} Verified Events
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Historical Record
            </button>
          )}
        </div>
      </div>

      {/* Coordinate & Severity Handling Notice */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-xs text-slate-300">
        <AlertOctagon className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 block mb-0.5">Pre-GPS Era Data Handling Notice</span>
          Historical records prior to GPS availability mark coordinates and severity as <code className="text-amber-300 font-mono">NOT_REPORTED</code>.
          SlopeGuard AI falls back to the parent area's centroid for map visualization and explicitly renders "Severity: not recorded" rather than inventing synthetic coordinates or severity grades.
        </div>
      </div>

      {/* Cards Grid of Historical Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {landslides.map((ls) => {
          const parentArea = areas.find(a => a.Area_ID === ls.Area_ID);
          return (
            <div
              key={ls.Landslide_ID}
              className="glass-panel rounded-2xl p-5 border border-slate-700/60 hover:border-purple-500/50 transition flex flex-col justify-between space-y-4 shadow-xl cursor-pointer"
              onClick={() => setSelectedEvent(ls)}
            >
              <div>
                {/* Event Top Bar */}
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/50">
                      {ls.Landslide_ID}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      {ls.Date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      ls.Severity === 'HIGH'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {ls.Severity === 'NOT_REPORTED' ? 'Severity: not recorded' : `${ls.Severity} SEVERITY`}
                    </span>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleOpenEditModal(ls, e)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Edit Historical Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(ls.Landslide_ID, e)}
                          className="p-1 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 transition"
                          title="Delete Historical Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Title & Location */}
                <h3 className="text-base font-bold text-white mb-1">{ls.Village}</h3>
                <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Area Link: <span className="text-emerald-400 font-mono font-semibold">{ls.Area_ID}</span> ({parentArea?.Village || 'Sikkim'}) • {ls.Road_Name}
                </p>

                {/* Triggers */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Geological / Environmental Triggers:</span>
                    {renderTags(ls.Trigger, 'bg-purple-950/40 text-purple-200 border-purple-800/40')}
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium block mb-1">Recorded Damage & Impact:</span>
                    {renderTags(ls.Damage, 'bg-red-950/30 text-red-200 border-red-800/30')}
                  </div>
                </div>
              </div>

              {/* Source Citation */}
              <div className="pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate">Source: <span className="text-slate-300 font-medium">{ls.Source}</span></span>
                <span className="text-purple-400 font-semibold flex items-center gap-1 hover:underline shrink-0">
                  Inspect Details <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Event Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-lg text-white">Event Detail: {selectedEvent.Landslide_ID}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono">
                <div>
                  <span className="text-slate-500 block">Date of Event:</span>
                  <span className="text-purple-300 font-bold text-sm">{selectedEvent.Date}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Severity Classification:</span>
                  <span className="text-white font-bold">
                    {selectedEvent.Severity === 'NOT_REPORTED' ? 'Not Recorded' : selectedEvent.Severity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Mapped Area ID:</span>
                  <span className="text-emerald-400 font-bold">{selectedEvent.Area_ID}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Coordinates Status:</span>
                  <span className="text-amber-400 font-bold">
                    {selectedEvent.Is_Fallback_Coords ? 'Area Centroid Fallback' : 'Exact GPS Recorded'}
                  </span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">Affected Sector / Village:</span>
                <p className="text-sm font-semibold text-white">{selectedEvent.Village}</p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">Road Corridor Affected:</span>
                <p className="text-slate-300">{selectedEvent.Road_Name}</p>
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">Triggering Factors:</span>
                {renderTags(selectedEvent.Trigger, 'bg-purple-950/40 text-purple-200 border-purple-800/40')}
              </div>

              <div>
                <span className="font-bold text-slate-200 block mb-1">Damage Description:</span>
                {renderTags(selectedEvent.Damage, 'bg-red-950/30 text-red-200 border-red-800/30')}
              </div>

              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400">
                <span className="font-bold text-slate-200 block mb-0.5">Authoritative Source:</span>
                {selectedEvent.Source}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="py-2 px-4 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Add/Edit Historical Event Modal */}
      {showModal && editingLandslide && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-lg text-white">
                {landslides.some(l => l.Landslide_ID === editingLandslide.Landslide_ID) ? 'Edit Historical Record' : 'Add Historical Landslide Record'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Landslide ID</label>
                  <input
                    type="text"
                    disabled
                    value={editingLandslide.Landslide_ID}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Event Date</label>
                  <input
                    type="text"
                    required
                    value={editingLandslide.Date}
                    onChange={(e) => setEditingLandslide({ ...editingLandslide, Date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                    placeholder="YYYY-MM-DD or Year"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Area / Village</label>
                <select
                  value={editingLandslide.Area_ID}
                  onChange={(e) => {
                    const selArea = areas.find(a => a.Area_ID === e.target.value);
                    setEditingLandslide({
                      ...editingLandslide,
                      Area_ID: e.target.value,
                      Village: selArea?.Village || editingLandslide.Village,
                      Road_Name: selArea?.Road_Name || editingLandslide.Road_Name
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2.5 text-white"
                >
                  {areas.map(a => (
                    <option key={a.Area_ID} value={a.Area_ID}>
                      {a.Area_ID} — {a.Village} ({a.District}) • {a.Road_Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Severity Grade</label>
                  <select
                    value={editingLandslide.Severity}
                    onChange={(e) => setEditingLandslide({ ...editingLandslide, Severity: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-bold"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                    <option value="NOT_REPORTED">NOT_REPORTED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Road Name</label>
                  <input
                    type="text"
                    required
                    value={editingLandslide.Road_Name}
                    onChange={(e) => setEditingLandslide({ ...editingLandslide, Road_Name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Triggering Factors (Semicolon Separated)</label>
                <input
                  type="text"
                  required
                  value={editingLandslide.Trigger}
                  onChange={(e) => setEditingLandslide({ ...editingLandslide, Trigger: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  placeholder="Heavy Monsoonal Rainfall; Slope Cut"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Recorded Damage & Impact</label>
                <input
                  type="text"
                  required
                  value={editingLandslide.Damage}
                  onChange={(e) => setEditingLandslide({ ...editingLandslide, Damage: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  placeholder="Road Blockage; 2 Houses Damaged"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Data Source</label>
                <input
                  type="text"
                  required
                  value={editingLandslide.Source}
                  onChange={(e) => setEditingLandslide({ ...editingLandslide, Source: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  placeholder="NIDM Report / Govt Press Release"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 rounded bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
