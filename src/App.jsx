import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import AreaDatabase from './components/AreaDatabase';
import HistoricalLandslides from './components/HistoricalLandslides';
import ResidentContacts from './components/ResidentContacts';
import AbnormalReportUpload from './components/AbnormalReportUpload';
import HistoricalComparison from './components/HistoricalComparison';
import UserManagement from './components/UserManagement';
import AlertsManager from './components/AlertsManager';
import Login from './components/Login';

import { fetchAreasData, fetchLandslidesData, fetchResidentsData } from './services/dataFallback';
import { getActiveSession, logoutUser } from './services/auth';
import { fetchAllReports } from './services/reports';

import { 
  ShieldAlert, 
  LayoutDashboard, 
  Database, 
  History, 
  Users, 
  UploadCloud, 
  GitCompare, 
  UserCheck, 
  Activity,
  ArrowRight,
  Radio,
  LogOut,
  User,
  Lock,
  Shield,
  AlertTriangle,
  Bell,
  CheckCircle2,
  X
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Application Data Stores
  const [areas, setAreas] = useState([]);
  const [landslides, setLandslides] = useState([]);
  const [residents, setResidents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportTargetArea, setReportTargetArea] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Initialize session from localStorage
  useEffect(() => {
    const active = getActiveSession();
    if (active) {
      setSession(active);
    }
    loadData();
    loadReports();
  }, []);

  const loadReports = async () => {
    const reps = await fetchAllReports();
    setReports(reps);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const loadedAreas = await fetchAreasData();
      const loadedLandslides = await fetchLandslidesData();
      const loadedResidents = await fetchResidentsData(loadedAreas);

      setAreas(loadedAreas || []);
      setLandslides(loadedLandslides || []);
      setResidents(loadedResidents || []);
    } catch (err) {
      console.error('Data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleLoginSuccess = (newSession) => {
    setSession(newSession);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    logoutUser();
    setSession(null);
  };

  const currentUser = session?.user;
  const userRole = currentUser?.Role || 'resident';
  const isAdmin = userRole === 'admin';

  // ROUTE GATING INTERCEPTOR: Prevent resident from accessing admin-only tabs
  const handleTabChange = (tabId) => {
    const adminOnlyTabs = ['residents', 'usermanagement'];
    if (adminOnlyTabs.includes(tabId) && !isAdmin) {
      showToast("You don't have permission to view this page.");
      setActiveTab('dashboard');
      return;
    }
    setActiveTab(tabId);
  };

  // CRUD Handler callbacks for Area Database
  const handleAddArea = (newArea) => {
    if (!isAdmin) return;
    setAreas(prev => [...prev, newArea]);
    fetch('/api/areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArea)
    })
      .then(() => loadData())
      .catch(() => {});
  };

  const handleUpdateArea = (updatedArea) => {
    if (!isAdmin) return;
    setAreas(prev => prev.map(a => a.Area_ID === updatedArea.Area_ID ? updatedArea : a));
    fetch(`/api/areas/${updatedArea.Area_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedArea)
    })
      .then(() => loadData())
      .catch(() => {});
  };

  const handleDeleteArea = (areaId) => {
    if (!isAdmin) return;
    setAreas(prev => prev.filter(a => a.Area_ID !== areaId));
    fetch(`/api/areas/${areaId}`, { method: 'DELETE' })
      .then(() => loadData())
      .catch(() => {});
  };

  // CRUD Handlers for Historical Landslides
  const handleAddLandslide = (newLs) => {
    if (!isAdmin) return;
    setLandslides(prev => [newLs, ...prev]);
    fetch('/api/landslides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLs)
    })
      .then(() => loadData())
      .catch(() => {});
  };

  const handleUpdateLandslide = (updatedLs) => {
    if (!isAdmin) return;
    setLandslides(prev => prev.map(l => l.Landslide_ID === updatedLs.Landslide_ID ? updatedLs : l));
    fetch(`/api/landslides/${updatedLs.Landslide_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedLs)
    })
      .then(() => loadData())
      .catch(() => {});
  };

  const handleDeleteLandslide = (lsId) => {
    if (!isAdmin) return;
    setLandslides(prev => prev.filter(l => l.Landslide_ID !== lsId));
    fetch(`/api/landslides/${lsId}`, { method: 'DELETE' })
      .then(() => loadData())
      .catch(() => {});
  };

  const handleAddResident = (newResident) => {
    if (!isAdmin) return;
    const entry = {
      Resident_ID: `RES-SK-${(residents.length + 1).toString().padStart(3, '0')}`,
      ...newResident,
      Is_Sample_Data: true
    };
    setResidents(prev => [...prev, entry]);
    fetch('/api/residents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newResident)
    })
      .then(() => loadData())
      .catch(() => {});
  };

  const handleSelectAreaForReport = (area) => {
    setReportTargetArea(area);
    setActiveTab('report');
  };

  // ROUTE PROTECTION: Unauthenticated Users hit Login Page
  if (!session) {
    return <Login areas={areas} onLoginSuccess={handleLoginSuccess} />;
  }

  // Navigation Items defined per role
  const allNavTabs = [
    { id: 'dashboard', label: 'Main Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'areas', label: `Area Database (${areas.length})`, icon: Database, adminOnly: false },
    { id: 'landslides', label: `Historical Events (${landslides.length})`, icon: History, adminOnly: false },
    { id: 'residents', label: 'Resident Directory', icon: Users, adminOnly: true, badge: 'Admin Only' },
    { id: 'report', label: 'Report Abnormal Condition', icon: UploadCloud, adminOnly: false },
    { id: 'comparison', label: 'Historical Comparison', icon: GitCompare, adminOnly: false },
    { id: 'alerts', label: 'Alerts', icon: Bell, adminOnly: false },
    { id: 'usermanagement', label: 'User Management', icon: Shield, adminOnly: true, badge: 'Admin Only' }
  ];

  // Filter navigation links for Residents (strictly hide admin-only links)
  const visibleNavTabs = allNavTabs.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white relative">
      
      {/* GLOBAL TOAST NOTIFICATION CONTAINER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[3000] p-4 rounded-2xl bg-red-950/90 border border-red-500/80 text-white shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-xs">Permission Denied</div>
            <div className="text-xs text-slate-200">{toastMessage}</div>
          </div>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & NAVBAR */}
      <header className="sticky top-0 z-[1500] glass-panel border-b border-slate-800 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Logo & Tagline with LOCKED Role Badge */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg glow-green flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-white tracking-tight font-sans">SlopeGuard AI</h1>
                {/* LOCKED ROLE BADGE — Reflects account's real role */}
                <span className={`px-2.5 py-0.5 rounded text-[9px] font-mono font-bold border uppercase ${
                  isAdmin 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                }`}>
                  {isAdmin ? 'DISASTER AUTHORITY (ADMIN)' : 'RESIDENT USER'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                AI-powered landslide monitoring and early warning platform
              </p>
            </div>
          </div>

          {/* User Profile & Logout Button (Replaces free switch toggle) */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-inner">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
                isAdmin ? 'bg-emerald-600' : 'bg-cyan-600'
              }`}>
                {currentUser?.Name?.charAt(0) || 'U'}
              </div>

              <div className="text-left">
                <div className="font-bold text-white text-xs flex items-center gap-1">
                  {currentUser?.Name}
                  <span className="text-[10px] text-slate-400 font-normal">({currentUser?.Village})</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {currentUser?.Title || (isAdmin ? 'Disaster Authority' : 'Local Resident')}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="ml-2 p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 transition flex items-center gap-1 text-[11px]"
                title="Sign out of SlopeGuard AI"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

        </div>

        {/* DATA FLOW VISUALIZATION BAR */}
        <div className="bg-slate-950/80 border-t border-slate-800/80 px-4 py-1.5 overflow-x-auto whitespace-nowrap text-[11px]">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-slate-400 min-w-[750px] font-mono">
            <span className="text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-ping" /> System Pipeline:
            </span>
            <span className="text-cyan-400">Environmental Data</span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-purple-400">AI Agent</span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-amber-400">Historical Comparison</span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-orange-400">Risk Analysis</span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-red-400">Risk Level</span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-rose-400">Dangerous Routes</span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-emerald-400">Safer Routes</span>
            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
            <span className="text-yellow-400 font-bold">Alerts</span>
          </div>
        </div>

        {/* NAVIGATION TABS (Strictly filtered per role) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
            {visibleNavTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 py-2 px-3.5 rounded-xl font-semibold text-xs transition shrink-0 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <Activity className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
            <p className="text-sm text-slate-400 font-mono">Loading Sikkim Area & Historical Landslide Datasets...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                areas={areas}
                landslides={landslides}
                userRole={userRole}
                currentUser={currentUser}
                reports={reports}
                onSelectAreaForReport={handleSelectAreaForReport}
              />
            )}

            {activeTab === 'areas' && (
              <AreaDatabase
                areas={areas}
                userRole={userRole}
                onAddArea={handleAddArea}
                onUpdateArea={handleUpdateArea}
                onDeleteArea={handleDeleteArea}
              />
            )}

            {activeTab === 'landslides' && (
              <HistoricalLandslides
                landslides={landslides}
                areas={areas}
                userRole={userRole}
                onAddLandslide={handleAddLandslide}
                onUpdateLandslide={handleUpdateLandslide}
                onDeleteLandslide={handleDeleteLandslide}
              />
            )}

            {/* DIRECT ACCESS ROUTE PROTECTION FOR RESIDENT CONTACTS DIRECTORY */}
            {activeTab === 'residents' && (
              isAdmin ? (
                <ResidentContacts
                  residents={residents}
                  userRole={userRole}
                  onAddResident={handleAddResident}
                />
              ) : (
                <div className="glass-panel rounded-2xl p-12 border border-red-800/40 text-center space-y-4 max-w-xl mx-auto my-8 shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-100">Access Restricted</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    You don't have permission to view this page. Access is restricted to logged-in <strong className="text-white">Disaster Management Authorities</strong>.
                  </p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg"
                  >
                    Return to Main Dashboard
                  </button>
                </div>
              )
            )}

            {activeTab === 'report' && (
              <AbnormalReportUpload
                areas={areas}
                initialArea={reportTargetArea}
                userRole={userRole}
                currentUser={currentUser}
                reports={reports}
                onReportsChange={setReports}
                onSubmitReport={(newRep) => {
                  showToast('Report submitted successfully.');
                }}
              />
            )}

            {activeTab === 'comparison' && (
              <HistoricalComparison
                areas={areas}
                landslides={landslides}
              />
            )}

            {activeTab === 'alerts' && (
              <AlertsManager
                userRole={userRole}
                areas={areas}
              />
            )}

            {/* DIRECT ACCESS ROUTE PROTECTION FOR USER MANAGEMENT */}
            {activeTab === 'usermanagement' && (
              isAdmin ? (
                <UserManagement
                  userRole={userRole}
                  areas={areas}
                />
              ) : (
                <div className="glass-panel rounded-2xl p-12 border border-red-800/40 text-center space-y-4 max-w-xl mx-auto my-8 shadow-2xl">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-100">Access Restricted</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    You don't have permission to view this page. Access is restricted to logged-in <strong className="text-white">Disaster Management Authorities</strong>.
                  </p>
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg"
                  >
                    Return to Main Dashboard
                  </button>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* 3. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 space-y-2">
        <div className="flex justify-center items-center gap-2 text-slate-400 font-semibold">
          <ShieldAlert className="w-4 h-4 text-emerald-400" /> SlopeGuard AI — Authenticated Landslide Risk Platform
        </div>
        <p className="max-w-2xl mx-auto text-[11px] text-slate-400 leading-relaxed">
          Driven end-to-end by official datasets (<code className="text-slate-300 font-mono">sikkim_area_data.csv</code> & <code className="text-slate-300 font-mono">sikkim_landslide_history.csv</code>). Role-Based Access Control active.
        </p>
      </footer>
    </div>
  );
}
