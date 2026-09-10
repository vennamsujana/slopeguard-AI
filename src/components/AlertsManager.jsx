import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Edit2, Trash2, Radio, Bell, Shield, CheckCircle2 } from 'lucide-react';

export default function AlertsManager({ userRole, areas = [] }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [notification, setNotification] = useState('');

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = () => {
    setLoading(true);
    fetch('/api/alerts')
      .then(res => res.json())
      .then(json => {
        if (json.success) setAlerts(json.data);
      })
      .catch(err => {
        console.error('Error fetching alerts:', err);
      })
      .finally(() => setLoading(false));
  };

  const handleOpenAddModal = () => {
    const selArea = areas[0] || { Area_ID: 'SK-001', Village: 'Gangtok', Road_Name: 'NH-10' };
    setEditingAlert({
      id: `ALT-${Date.now().toString().slice(-4)}`,
      type: 'HIGH',
      areaId: selArea.Area_ID,
      village: selArea.Village,
      road: selArea.Road_Name,
      title: `⚠️ DISASTER WARNING: Monsoonal Instability near ${selArea.Village}`,
      message: `Rising soil saturation and slope strain detected in ${selArea.Village} sector (${selArea.Road_Name}). Caution advised.`,
      timestamp: new Date().toISOString()
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (alt) => {
    setEditingAlert({ ...alt });
    setShowModal(true);
  };

  const handleDeleteAlert = (id) => {
    if (!isAdmin) return;
    setAlerts(prev => prev.filter(a => a.id !== id));
    fetch(`/api/alerts/${id}`, { method: 'DELETE' })
      .then(() => fetchAlerts())
      .catch(() => {});
    setNotification('Alert deleted successfully.');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleSaveAlert = (e) => {
    e.preventDefault();
    if (!isAdmin || !editingAlert) return;

    const exists = alerts.some(a => a.id === editingAlert.id);
    if (exists) {
      setAlerts(prev => prev.map(a => a.id === editingAlert.id ? editingAlert : a));
      fetch(`/api/alerts/${editingAlert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAlert)
      })
        .then(() => fetchAlerts())
        .catch(() => {});
      setNotification('Alert updated.');
    } else {
      setAlerts(prev => [editingAlert, ...prev]);
      fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAlert)
      })
        .then(() => fetchAlerts())
        .catch(() => {});
      setNotification('New emergency alert created and broadcasted.');
    }

    setShowModal(false);
    setTimeout(() => setNotification(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-400 animate-pulse" />
            <h2 className="text-xl font-bold text-slate-100">Live Early Warning & Disaster Alerts Feed</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time public safety bulletins dispatched to local Sikkim residents and emergency transport corridors.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAddModal}
            className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition shadow-lg flex items-center gap-2 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Push Manual Emergency Alert
          </button>
        )}
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Role-based notice banner */}
      <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
        isAdmin ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>
            {isAdmin 
              ? 'Administrator Mode: You can create, edit, or remove broadcasted disaster warning bulletins.' 
              : 'Resident View: Displaying active early warning alerts and evacuation advisories for Sikkim.'
            }
          </span>
        </div>
        <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">{alerts.length} Active Bulletins</span>
      </div>

      {/* Grid of Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alt) => (
          <div key={alt.id} className="glass-panel rounded-2xl p-5 border border-slate-700/60 flex flex-col justify-between space-y-3 shadow-xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-2">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  alt.type === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40 glow-red' :
                  alt.type === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                }`}>
                  {alt.type} RISK BULLETIN
                </span>

                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(alt.timestamp).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-bold text-sm text-white mb-1">{alt.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">{alt.message}</p>

              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800">
                <span>Village: <strong className="text-emerald-400">{alt.village}</strong></span>
                <span>Road: <strong className="text-slate-200">{alt.road}</strong></span>
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleOpenEditModal(alt)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-xs flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteAlert(alt.id)}
                  className="p-1.5 rounded bg-red-950/60 hover:bg-red-900/80 text-red-300 transition text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Admin Add/Edit Alert Modal */}
      {showModal && editingAlert && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-lg text-white">
                  {alerts.some(a => a.id === editingAlert.id) ? 'Edit Emergency Alert' : 'Broadcast Emergency Alert'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAlert} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Village / Sector</label>
                <select
                  value={editingAlert.village}
                  onChange={(e) => {
                    const sel = areas.find(a => a.Village === e.target.value);
                    setEditingAlert({
                      ...editingAlert,
                      village: e.target.value,
                      areaId: sel?.Area_ID || 'SK-001',
                      road: sel?.Road_Name || 'NH-10'
                    });
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2.5 text-white"
                >
                  {areas.map(a => (
                    <option key={a.Area_ID} value={a.Village}>
                      {a.Village} ({a.District} District) • {a.Road_Name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Severity Type</label>
                  <select
                    value={editingAlert.type}
                    onChange={(e) => setEditingAlert({ ...editingAlert, type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-bold"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MODERATE">MODERATE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Corridor Road</label>
                  <input
                    type="text"
                    required
                    value={editingAlert.road}
                    onChange={(e) => setEditingAlert({ ...editingAlert, road: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Bulletin Headline</label>
                <input
                  type="text"
                  required
                  value={editingAlert.title}
                  onChange={(e) => setEditingAlert({ ...editingAlert, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2.5 text-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Detailed Message / Advisory</label>
                <textarea
                  required
                  rows={3}
                  value={editingAlert.message}
                  onChange={(e) => setEditingAlert({ ...editingAlert, message: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2.5 text-white"
                ></textarea>
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
                  className="py-2 px-4 rounded bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
