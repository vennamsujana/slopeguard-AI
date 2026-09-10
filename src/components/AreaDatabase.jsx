import React, { useState } from 'react';
import { Database, Search, Filter, Plus, Edit2, Trash2, MapPin, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AreaDatabase({ areas = [], userRole, onUpdateArea, onAddArea, onDeleteArea }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [editingArea, setEditingArea] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const isAdmin = userRole === 'admin';

  // Extract unique districts
  const districts = Array.from(new Set(areas.map(a => a.District))).filter(Boolean);

  const filteredAreas = areas.filter(area => {
    const matchesSearch = 
      area.Village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.Area_ID?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.Road_Name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDistrict = !districtFilter || area.District === districtFilter;
    const matchesRisk = !riskFilter || area.Risk_Level === riskFilter;

    return matchesSearch && matchesDistrict && matchesRisk;
  });

  const handleOpenAddModal = () => {
    setEditingArea({
      Area_ID: `SK-${(areas.length + 1).toString().padStart(3, '0')}`,
      State: 'Sikkim',
      District: districts[0] || 'Gangtok',
      Village: '',
      Latitude: 27.33,
      Longitude: 88.61,
      Road_Name: 'NH-10',
      Road_Status: 'Open',
      Population: 5000,
      Risk_Level: 'HIGH'
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (area) => {
    setEditingArea({ ...area });
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const isNew = !areas.some(a => a.Area_ID === editingArea.Area_ID);
    if (isNew) {
      onAddArea && onAddArea(editingArea);
    } else {
      onUpdateArea && onUpdateArea(editingArea);
    }
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Sikkim Area Information Database</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Seeded directly from <code className="text-emerald-400 font-mono">sikkim_area_data.csv</code> ({areas.length} areas across Sikkim districts).
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add New Area Record
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-xl p-4 border border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Village, Area ID, Road Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Districts ({districts.length})</option>
          {districts.map(d => (
            <option key={d} value={d}>{d} District</option>
          ))}
        </select>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Risk Levels</option>
          <option value="HIGH">HIGH Risk</option>
          <option value="MEDIUM">MEDIUM Risk</option>
          <option value="LOW">LOW Risk</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="glass-panel rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-200">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-3.5">Area ID</th>
                <th className="p-3.5">Village / Location</th>
                <th className="p-3.5">District</th>
                <th className="p-3.5">Coordinates</th>
                <th className="p-3.5">Road Name</th>
                <th className="p-3.5">Road Status</th>
                <th className="p-3.5">Population</th>
                <th className="p-3.5">Risk Level</th>
                {isAdmin && <th className="p-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredAreas.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="p-8 text-center text-slate-400">
                    No matching area records found.
                  </td>
                </tr>
              ) : (
                filteredAreas.map((area) => (
                  <tr key={area.Area_ID} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">{area.Area_ID}</td>
                    <td className="p-3.5 font-semibold text-slate-100">{area.Village}</td>
                    <td className="p-3.5 text-slate-300">{area.District}</td>
                    <td className="p-3.5 font-mono text-slate-400 text-[11px]">
                      {area.Latitude?.toFixed(4)}, {area.Longitude?.toFixed(4)}
                    </td>
                    <td className="p-3.5 text-slate-300">{area.Road_Name}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        area.Road_Status === 'Restricted'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {area.Road_Status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{area.Population?.toLocaleString()}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-md font-bold uppercase ${
                        area.Risk_Level === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                          : area.Risk_Level === 'MEDIUM'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {area.Risk_Level}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(area)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Edit Area"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteArea && onDeleteArea(area.Area_ID)}
                          className="p-1.5 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 transition"
                          title="Delete Area"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Add/Edit Modal */}
      {showModal && editingArea && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-lg text-white">
                {areas.some(a => a.Area_ID === editingArea.Area_ID) ? 'Edit Area Record' : 'Add New Area Record'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Area ID</label>
                  <input
                    type="text"
                    value={editingArea.Area_ID}
                    disabled
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Village</label>
                  <input
                    type="text"
                    required
                    value={editingArea.Village}
                    onChange={(e) => setEditingArea({ ...editingArea, Village: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={editingArea.District}
                    onChange={(e) => setEditingArea({ ...editingArea, District: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Road Name</label>
                  <input
                    type="text"
                    required
                    value={editingArea.Road_Name}
                    onChange={(e) => setEditingArea({ ...editingArea, Road_Name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={editingArea.Latitude}
                    onChange={(e) => setEditingArea({ ...editingArea, Latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={editingArea.Longitude}
                    onChange={(e) => setEditingArea({ ...editingArea, Longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Road Status</label>
                  <select
                    value={editingArea.Road_Status}
                    onChange={(e) => setEditingArea({ ...editingArea, Road_Status: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Open">Open</option>
                    <option value="Restricted">Restricted</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Population</label>
                  <input
                    type="number"
                    required
                    value={editingArea.Population}
                    onChange={(e) => setEditingArea({ ...editingArea, Population: parseInt(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Risk Level</label>
                  <select
                    value={editingArea.Risk_Level}
                    onChange={(e) => setEditingArea({ ...editingArea, Risk_Level: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-bold"
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="py-2 px-4 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Save Area Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
