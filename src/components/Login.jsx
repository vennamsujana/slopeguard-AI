import React, { useState, useEffect, useRef } from 'react';
import { loginUser, authenticateGoogleUser, registerResident } from '../services/auth';
import { 
  ShieldAlert, 
  Lock, 
  UserCheck, 
  Mail, 
  User, 
  AlertCircle, 
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  KeyRound,
  MapPin
} from 'lucide-react';

export default function Login({ areas = [], onLoginSuccess }) {
  const [role, setRole] = useState('admin'); // 'admin' | 'resident'
  const [residentAuthMode, setResidentAuthMode] = useState('google'); // 'google' | 'login' | 'register'

  // Form states
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Resident registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Resident Village Selector State
  const [selectedVillage, setSelectedVillage] = useState(areas[0]?.Village || 'Gangtok');

  // Google OAuth 2.0 Configuration State
  const [envClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || '586433670374-j4n4qck8s87vcku623mtql7k5ekkh09q.apps.googleusercontent.com');
  const [manualClientId, setManualClientId] = useState('');
  const [showClientIdInput, setShowClientIdInput] = useState(false);
  const googleBtnRef = useRef(null);

  const activeClientId = envClientId || manualClientId;

  const handleResidentLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const session = await loginUser(emailOrUsername, password, 'resident');
      onLoginSuccess && onLoginSuccess(session);
    } catch (err) {
      setLoginError(err.message || 'Resident login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResidentRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const selArea = areas.find(a => a.Village === selectedVillage);
      const session = await registerResident({
        name: regName,
        email: regEmail,
        password: regPassword,
        village: selectedVillage || 'Gangtok',
        district: selArea?.District || 'Gangtok'
      });
      onLoginSuccess && onLoginSuccess(session);
    } catch (err) {
      setLoginError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Official Google Identity Services (GIS SDK)
  useEffect(() => {
    if (role === 'resident' && activeClientId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          auto_select: false,
          use_fedcm_for_prompt: false,
          cancel_on_tap_outside: false,
          callback: async (response) => {
            if (response.credential) {
              setLoading(true);
              setLoginError('');
              try {
                // Safely decode Google OAuth 2.0 JWT ID token
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const googlePayload = JSON.parse(jsonPayload);

                // Auto-create or authenticate Resident using real Google profile data
                const session = await authenticateGoogleUser({
                  sub: googlePayload.sub,
                  email: googlePayload.email,
                  name: googlePayload.name || googlePayload.email.split('@')[0],
                  picture: googlePayload.picture,
                  village: selectedVillage || 'Gangtok'
                }, 'resident', selectedVillage || 'Gangtok');

                if (session) {
                  onLoginSuccess && onLoginSuccess(session);
                }
              } catch (err) {
                setLoginError(err.message || 'Failed to authenticate Google OAuth profile.');
              } finally {
                setLoading(false);
              }
            }
          }
        });

        // Render official Google Sign-In button
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'pill',
          text: 'signin_with',
          width: 320
        });

        try {
          window.google.accounts.id.prompt();
        } catch (e) {}
      } catch (e) {
        console.warn('Google Identity Services SDK init error:', e);
      }
    }
  }, [activeClientId, role, selectedVillage]);

  const handleRoleSelect = (targetRole) => {
    setRole(targetRole);
    setLoginError('');
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const session = await loginUser(emailOrUsername, password, 'admin');
      onLoginSuccess && onLoginSuccess(session);
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      
      {/* Dynamic Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Column: Branding & Overview */}
        <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 p-2 rounded-2xl glass-card border border-emerald-500/30 glow-green">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-7 h-7 text-emerald-400" />
              </div>
            </div>
            <div className="text-left pr-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">SlopeGuard AI</h1>
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                Sikkim Disaster Platform
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold text-white leading-tight">
              Intelligent Landslide Monitoring & Early Warning
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time telemetry synthesis, historical disaster cross-referencing, and AI-driven safer route optimization for Northeast India.
            </p>
          </div>

          {/* Role-Based Auth Badge */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 text-left">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold mb-0.5">Role-Based Access Control System</strong>
              Disaster Management Administrators sign in using secure credentials. Residents authenticate using official Google Identity Services OAuth 2.0.
            </div>
          </div>
        </div>

        {/* Right Column: Login Box */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl space-y-6">
          
          {/* Header & Role Toggle Selector */}
          <div className="space-y-4 border-b border-slate-800 pb-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white">Platform Authentication</h2>
              <span className="text-[11px] text-slate-500 font-mono">RBAC Auth Gate</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Target Account Role</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => handleRoleSelect('admin')}
                  className={`py-2.5 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                    role === 'admin'
                      ? 'bg-emerald-600/90 text-white border border-emerald-500/50 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4" /> Disaster Authority (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect('resident')}
                  className={`py-2.5 px-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                    role === 'resident'
                      ? 'bg-cyan-600/90 text-white border border-cyan-500/50 shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-4 h-4" /> Resident User
                </button>
              </div>
            </div>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* ROLE 1: ADMIN LOGIN FORM (EMAIL/USERNAME + PASSWORD) */}
          {role === 'admin' && (
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Email or Username</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    name="no_autofill_admin_email"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    placeholder="sreejaunnam@gmail.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    name="no_autofill_admin_pass"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating Admin Session...' : 'Authenticate & Access Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ROLE 2: RESIDENT USER (OFFICIAL GOOGLE OAUTH 2.0 ONLY — NO USERNAME OR PASSWORD) */}
          {role === 'resident' && (
            <div className="space-y-5">
              
              {/* Residential Village Selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 text-xs flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Select Residential Village (Sikkim Datasets)
                </label>
                <select
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {areas.map(a => (
                    <option key={a.Area_ID} value={a.Village}>
                      {a.Village} ({a.District} District) • Corridor: {a.Road_Name}
                    </option>
                  ))}
                </select>
              </div>

              {/* OFFICIAL GOOGLE OAUTH 2.0 CONTAINER */}
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-lg text-center space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white">Resident Sign In with Google</h3>
                  <p className="text-xs text-slate-400">Authenticates & registers your Resident profile via Google Consent Flow</p>
                </div>

                {activeClientId ? (
                  <div className="flex flex-col items-center justify-center space-y-2 py-2">
                    <div ref={googleBtnRef} className="min-h-[44px]"></div>
                    <span className="text-[10px] text-slate-400 font-mono">No username or password required</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-left space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Google Sign-In requires an OAuth Client ID</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      Add your <code className="text-emerald-400 font-mono bg-slate-900 px-1 py-0.5 rounded">VITE_GOOGLE_CLIENT_ID</code> to your <code className="text-slate-200 font-mono">.env</code> file.
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
