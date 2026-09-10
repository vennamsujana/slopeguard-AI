import React, { useState } from 'react';
import { Users, Search, Lock, ShieldAlert, PhoneCall, Plus, MapPin, AlertCircle } from 'lucide-react';

export default function ResidentContacts({ residents = [], userRole, onAddResident }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResident, setNewResident] = useState({
    Name: '',
    Contact_Number: '+91 ',
    Residential_Area: '',
    Village: '',
    District: 'Gangtok',
    Emergency_Contact: '+91 '
  });

  const isAdmin = userRole === 'admin';

  // Extract unique villages
  const villages = Array.from(new Set(residents.map(r => r.Village))).filter(Boolean);

  const filteredResidents = residents.filter(r => {
    const matchesSearch = 
      r.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.Village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.Resident_ID?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVillage = !villageFilter || r.Village === villageFilter;
    return matchesSearch && matchesVillage;
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    onAddResident && onAddResident(newResident);
    setShowAddModal(false);
  };

  // Restricted Access View for non-admins
  if (!isAdmin) {
    return (
      <div className="glass-panel rounded-2xl p-12 border border-slate-700/60 text-center space-y-4 max-w-2xl mx-auto my-8 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Restricted Access Directory</h2>
        <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          Resident contact records contain sensitive emergency contact details and are restricted to authorized <strong className="text-white">District Disaster Management Authorities & Admins</strong>.
        </p>
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs inline-flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Switch role to "Administrator / Disaster Authority" in top header to unlock directory.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">Sikkim Resident Emergency Contact Directory</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authorised view for emergency evacuations and disaster notification dispatch.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register Resident Contact
        </button>
      </div>

      {/* Mandatory Disclaimer Tag */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span className="font-semibold">Sample contact data — not sourced from real records.</span>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="glass-panel rounded-xl p-4 border border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Resident Name, Resident ID, Village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={villageFilter}
          onChange={(e) => setVillageFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Villages ({villages.length})</option>
          {villages.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-200">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-3.5">Resident ID</th>
                <th className="p-3.5">Resident Name</th>
                <th className="p-3.5">Village / District</th>
                <th className="p-3.5">Residential Corridor</th>
                <th className="p-3.5">Contact Number</th>
                <th className="p-3.5">Emergency Contact</th>
                <th className="p-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No matching resident contact records found.
                  </td>
                </tr>
              ) : (
                filteredResidents.map((r) => (
                  <tr key={r.Resident_ID} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-emerald-400 font-bold">{r.Resident_ID}</td>
                    <td className="p-3.5 font-bold text-white text-sm">{r.Name}</td>
                    <td className="p-3.5 text-slate-300">
                      {r.Village} <span className="text-slate-500">({r.District})</span>
                    </td>
                    <td className="p-3.5 text-slate-300">{r.Residential_Area}</td>
                    <td className="p-3.5 font-mono text-slate-200">{r.Contact_Number}</td>
                    <td className="p-3.5 font-mono text-red-400">{r.Emergency_Contact}</td>
                    <td className="p-3.5 text-right">
                      <a
                        href={`tel:${r.Contact_Number}`}
                        className="inline-flex items-center gap-1 py-1 px-3 rounded bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold text-[11px] transition shadow"
                      >
                        <PhoneCall className="w-3 h-3" /> Call Resident
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Resident Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="font-bold text-lg text-white">Register Resident Contact</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newResident.Name}
                  onChange={(e) => setNewResident({ ...newResident, Name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  placeholder="e.g. Tashi Bhutia"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Village</label>
                  <input
                    type="text"
                    required
                    value={newResident.Village}
                    onChange={(e) => setNewResident({ ...newResident, Village: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                    placeholder="e.g. Gangtok"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={newResident.District}
                    onChange={(e) => setNewResident({ ...newResident, District: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Residential Street / Corridor</label>
                <input
                  type="text"
                  required
                  value={newResident.Residential_Area}
                  onChange={(e) => setNewResident({ ...newResident, Residential_Area: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  placeholder="e.g. NH-10 Upper Ward"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Primary Phone</label>
                  <input
                    type="text"
                    required
                    value={newResident.Contact_Number}
                    onChange={(e) => setNewResident({ ...newResident, Contact_Number: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    required
                    value={newResident.Emergency_Contact}
                    onChange={(e) => setNewResident({ ...newResident, Emergency_Contact: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-4 rounded bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Register Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
