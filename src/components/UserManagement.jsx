import React, { useState, useEffect } from 'react';
import { getUsers, createAdminUser, toggleUserStatus } from '../services/auth';
import { Users, UserCheck, Shield, Plus, Search, Lock, AlertCircle, CheckCircle2, UserX, Key } from 'lucide-react';

export default function UserManagement({ userRole, areas = [] }) {
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [notification, setNotification] = useState('');

  // New admin form state
  const [adminFormData, setAdminFormData] = useState({
    name: '',
    email: '',
    password: '',
    title: 'Disaster Management Officer',
    village: areas[0]?.Village || 'Gangtok',
    district: areas[0]?.District || 'Gangtok'
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = userRole === 'admin';

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const allUsers = await getUsers();
    setUsersList(allUsers);
  };

  const handleToggleStatus = async (userId) => {
    if (!isAdmin) return;
    const updated = await toggleUserStatus(userId);
    if (updated) {
      setNotification(`Account ${updated.Email} status changed to ${updated.Status.toUpperCase()}`);
      loadUsers();
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const handleCreateAdminSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      const created = await createAdminUser(adminFormData);
      setNotification(`Successfully created new Administrator account: ${created.Email}`);
      setShowAddAdminModal(false);
      setAdminFormData({
        name: '',
        email: '',
        password: '',
        title: 'Disaster Management Officer',
        village: areas[0]?.Village || 'Gangtok',
        district: areas[0]?.District || 'Gangtok'
      });
      loadUsers();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to create Admin account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="glass-panel rounded-2xl p-12 border border-red-800/40 text-center space-y-4 max-w-xl mx-auto my-8 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100">User Management — Not Authorized</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          User directory & role access administration is restricted to authorized <strong className="text-white">Disaster Authority Administrators</strong>.
        </p>
      </div>
    );
  }

  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      u.Name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.Email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.Village?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.User_ID?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = !roleFilter || u.Role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-slate-100">SlopeGuard Account Directory & User Management</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Authorised view for managing registered residents, toggling account statuses, and seeding Disaster Authority admins.
          </p>
        </div>

        <button
          onClick={() => setShowAddAdminModal(true)}
          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-lg flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Admin Account
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="glass-panel rounded-xl p-4 border border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search User ID, Name, Email, Village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Account Roles ({usersList.length})</option>
          <option value="admin">Disaster Authority (Admin)</option>
          <option value="resident">Registered Resident</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-200">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-3.5">User ID</th>
                <th className="p-3.5">Full Name</th>
                <th className="p-3.5">Email / Username</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Village / District</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No matching user records found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isUserAdmin = u.Role === 'admin';
                  const isDeactivated = u.Status === 'deactivated';

                  return (
                    <tr key={u.User_ID} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">{u.User_ID}</td>
                      <td className="p-3.5 font-bold text-white text-sm">{u.Name}</td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {u.Email}
                        <span className="block text-[10px] text-slate-500 font-sans">@{u.Username}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                          isUserAdmin ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {isUserAdmin ? 'Disaster Authority' : 'Resident'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300">
                        {u.Village} <span className="text-slate-500">({u.District})</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                          isDeactivated ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {isDeactivated ? 'Deactivated' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {isUserAdmin ? (
                          <span className="text-[10px] text-slate-500 italic">Protected Admin</span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(u.User_ID)}
                            className={`py-1 px-2.5 rounded font-semibold text-[11px] transition inline-flex items-center gap-1 ${
                              isDeactivated
                                ? 'bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-300'
                                : 'bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300'
                            }`}
                          >
                            {isDeactivated ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Reactivate Account
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" /> Deactivate Account
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Create Admin Account */}
      {showAddAdminModal && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg text-white">Create Disaster Authority Admin</h3>
              </div>
              <button onClick={() => setShowAddAdminModal(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdminSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Official Full Name</label>
                <input
                  type="text"
                  required
                  value={adminFormData.name}
                  onChange={(e) => setAdminFormData({ ...adminFormData, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  placeholder="e.g. Dr. K. Sharma"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Government / Authority Email</label>
                <input
                  type="email"
                  required
                  value={adminFormData.email}
                  onChange={(e) => setAdminFormData({ ...adminFormData, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                  placeholder="officer@slopeguard.gov.in"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={adminFormData.password}
                  onChange={(e) => setAdminFormData({ ...adminFormData, password: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Official Designation Title</label>
                <input
                  type="text"
                  required
                  value={adminFormData.title}
                  onChange={(e) => setAdminFormData({ ...adminFormData, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  placeholder="Chief Disaster Officer, SDMA"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">HQ Station Village</label>
                  <select
                    value={adminFormData.village}
                    onChange={(e) => {
                      const sel = areas.find(a => a.Village === e.target.value);
                      setAdminFormData({
                        ...adminFormData,
                        village: e.target.value,
                        district: sel?.District || 'Gangtok'
                      });
                    }}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  >
                    {areas.map(a => (
                      <option key={a.Area_ID} value={a.Village}>{a.Village}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">District</label>
                  <input
                    type="text"
                    disabled
                    value={adminFormData.district}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="py-2 px-4 rounded bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {submitting ? 'Creating Admin...' : 'Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
