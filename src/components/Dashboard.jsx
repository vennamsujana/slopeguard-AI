import React, { useState, useEffect } from 'react';
import SikkimMap from './SikkimMap';
import { runClientAiAnalysis } from '../services/dataFallback';
import { 
  ShieldAlert, 
  Activity, 
  Wind, 
  Droplets, 
  Compass, 
  AlertTriangle, 
  Navigation, 
  PhoneCall, 
  BrainCircuit, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  Info,
  ChevronRight,
  Radio,
  FileText,
  UploadCloud
} from 'lucide-react';

export default function Dashboard({ areas = [], landslides = [], userRole, currentUser, onSelectAreaForReport, reports = [] }) {
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedLandslide, setSelectedLandslide] = useState(null);
  const [environmentalData, setEnvironmentalData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showSaferRouteModal, setShowSaferRouteModal] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);

  // Interactive telemetry overrides to test AI risk engine
  const [telemetryOverride, setTelemetryOverride] = useState({
    rainfall_mm_hr: 55,
    soil_moisture_percent: 82,
    ground_movement_mm: 3.8,
    slope_angle_deg: 42
  });

  // Initialize with default area SK-001 (Gangtok) or resident's registered village
  useEffect(() => {
    if (areas.length > 0 && !selectedArea) {
      if (userRole === 'resident' && currentUser?.Village) {
        const userArea = areas.find(a => a.Village?.toLowerCase() === currentUser.Village?.toLowerCase());
        if (userArea) {
          setSelectedArea(userArea);
          return;
        }
      }
      setSelectedArea(areas[0]);
    }
  }, [areas, currentUser, userRole]);

  // Load routes and alerts
  useEffect(() => {
    fetch('/api/routes')
      .then(res => res.json())
      .then(json => json.success && setRoutes(json.data))
      .catch(err => {
        setRoutes([
          {
            routeId: 'ROUTE-01',
            roadName: 'NH-10 Corridor (Gangtok - Singtam - Mangan)',
            affectedAreas: ['SK-001 (Gangtok)', 'SK-037 (Singtam)', 'SK-009 (Mangan)'],
            riskLevel: 'HIGH',
            status: 'High Sinking Risk / Active Landslide Zone',
            dangerReason: 'Frequent debris slides, heavy monsoonal runoff, steep cut slopes, and historical slide history (1957, 1995, 1997 records).',
            historicalReference: '1997 Gangtok & Singtam slides (43 deaths, 300+ houses damaged).',
            saferRoute: {
              name: 'Pakyong - Rhenock Bypass (NH-717A)',
              status: 'Open',
              additionalTimeMinutes: 25,
              description: 'Alternate highway via Pakyong & Rhenock with gentler slopes and reinforced retaining walls.'
            },
            coordinates: [
              [27.3314, 88.6138],
              [27.2680, 88.6120],
              [27.2350, 88.5020],
              [27.5000, 88.5300]
            ]
          },
          {
            routeId: 'ROUTE-02',
            roadName: 'North Sikkim Highway (NH-310A Chungthang - Lachen)',
            affectedAreas: ['SK-010 (Chungthang)', 'SK-011 (Lachen)', 'SK-013 (Dzongu)'],
            riskLevel: 'CRITICAL',
            status: 'Restricted - Emergency Vehicles Only',
            dangerReason: 'Active flash floods, heavy river scour from Siksa Khola, rockfalls, and unstable slope geology.',
            historicalReference: '1983 Manul landslide (65 deaths, GREF camp wiped out).',
            saferRoute: {
              name: 'Dzongu Interior Feeder Road (Restricted Transit)',
              status: 'Restricted Access',
              additionalTimeMinutes: 40,
              description: 'Use secondary ridge-line feeder road. Escort required for heavy vehicles.'
            },
            coordinates: [
              [27.5000, 88.5300],
              [27.5900, 88.6400],
              [27.7200, 88.5600]
            ]
          }
        ]);
      });

    fetch('/api/alerts')
      .then(res => res.json())
      .then(json => json.success && setAlerts(json.data))
      .catch(err => {
        setAlerts([
          {
            id: 'ALT-101',
            type: 'CRITICAL',
            village: 'Mangan',
            road: 'NH-10',
            timestamp: new Date().toISOString(),
            title: '🚨 CRITICAL: High Moisture & Historical Debris Slump near Mangan (NH-10)',
            message: 'Sensors detect rising soil moisture (88%) near Mangan on NH-10. Historically, this area experienced major landslides dating back to 1957. Restricted heavy vehicle movement advised.'
          },
          {
            id: 'ALT-102',
            type: 'HIGH',
            village: 'Chungthang',
            road: 'NH-310A',
            timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
            title: '⚠️ HIGH RISK: Chungthang - NH-310A Restricted Corridor',
            message: 'Active water accumulation and steep terrain instability. Historical NIDM records note major historical events (1983, 1997) in this sector. Monitor closely.'
          }
        ]);
      });
  }, []);

  // Fetch Environmental and AI Analysis when selected area or telemetry overrides change
  useEffect(() => {
    if (!selectedArea) return;

    fetch(`/api/environmental/${selectedArea.Area_ID}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setEnvironmentalData(json.data);
          // Set initial override sliders based on area defaults if desired
        }
      })
      .catch(err => console.error('Environmental fetch error:', err));

    runAiAnalysis(selectedArea.Area_ID, telemetryOverride);
  }, [selectedArea]);

  const runAiAnalysis = (areaId, overrides) => {
    setLoadingAi(true);
    const targetArea = areas.find(a => a.Area_ID === areaId) || selectedArea;
    fetch('/api/ai-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        areaId: areaId,
        sensorOverride: overrides
      })
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setAiAnalysis(json.data);
        } else {
          throw new Error('Fallback to client AI engine');
        }
      })
      .catch(err => {
        if (targetArea) {
          const clientAnalysis = runClientAiAnalysis(targetArea, overrides, landslides);
          setAiAnalysis(clientAnalysis);
        }
      })
      .finally(() => setLoadingAi(false));
  };

  const handleSliderChange = (field, val) => {
    const updated = { ...telemetryOverride, [field]: Number(val) };
    setTelemetryOverride(updated);
    if (selectedArea) {
      runAiAnalysis(selectedArea.Area_ID, updated);
    }
  };

  const getRiskCardBg = (level) => {
    switch (level) {
      case 'CRITICAL': return 'bg-gradient-to-br from-red-950/80 via-red-900/50 to-slate-900 border-red-500/60 glow-red';
      case 'HIGH': return 'bg-gradient-to-br from-orange-950/80 via-orange-900/50 to-slate-900 border-orange-500/60 glow-orange';
      case 'MODERATE': return 'bg-gradient-to-br from-amber-950/80 via-amber-900/50 to-slate-900 border-amber-500/60 glow-yellow';
      default: return 'bg-gradient-to-br from-emerald-950/80 via-emerald-900/50 to-slate-900 border-emerald-500/60 glow-green';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO SECTION & LIVE RISK STATUS CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Status Indicator Card */}
        <div className={`lg:col-span-2 rounded-2xl p-6 border shadow-2xl transition-all duration-300 relative overflow-hidden ${
          getRiskCardBg(aiAnalysis?.calculatedRiskLevel)
        }`}>
          {/* Subtle background glow element */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase bg-white/10 border border-white/20 text-slate-200">
                  Area ID: {selectedArea?.Area_ID || 'SK-001'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {selectedArea?.District} District • {selectedArea?.State}
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                {selectedArea?.Village} Sector
                {selectedArea?.Road_Status === 'Restricted' && (
                  <span className="text-xs px-2.5 py-1 rounded-md bg-red-500/20 text-red-300 border border-red-500/40 font-semibold">
                    Road Restricted ({selectedArea?.Road_Name})
                  </span>
                )}
              </h2>
            </div>

            {/* Risk Badge & Score */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-300 uppercase tracking-wider font-semibold">SlopeGuard Index</div>
                <div className="text-3xl font-extrabold font-mono text-white">
                  {aiAnalysis?.riskScore || '--'}<span className="text-lg text-slate-400">/100</span>
                </div>
              </div>

              <div className="px-4 py-3 rounded-xl bg-slate-900/90 border border-white/15 flex items-center gap-3 shadow-inner">
                <span className={`w-4 h-4 rounded-full ${
                  aiAnalysis?.calculatedRiskLevel === 'CRITICAL' ? 'bg-red-500 pulse-critical' :
                  aiAnalysis?.calculatedRiskLevel === 'HIGH' ? 'bg-orange-500 glow-orange' :
                  aiAnalysis?.calculatedRiskLevel === 'MODERATE' ? 'bg-amber-500 glow-yellow' : 'bg-emerald-500 glow-green'
                }`}></span>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Current Assessment</div>
                  <div className="text-sm font-extrabold tracking-wide text-white">
                    {aiAnalysis?.badgeLabel || 'ANALYZING...'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Risk Factors Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Main Risk Factors (Derived from Area Data + Telemetry)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {aiAnalysis?.mainRiskFactors?.map((factor, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-xs text-slate-200">
                  <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Area Selector & Resident Quick Contact Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                Select Sikkim Region
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">50 Areas Loaded</span>
            </div>

            <label className="block text-xs text-slate-400 font-medium mb-1.5">Focus Sector Area</label>
            <select
              value={selectedArea?.Area_ID || ''}
              onChange={(e) => {
                const area = areas.find(a => a.Area_ID === e.target.value);
                if (area) setSelectedArea(area);
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {areas.map(a => (
                <option key={a.Area_ID} value={a.Area_ID}>
                  {a.Area_ID} — {a.Village} ({a.District} District) • [{a.Risk_Level} Risk]
                </option>
              ))}
            </select>

            <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span>Corridor Highway:</span>
                <span className="font-semibold text-white">{selectedArea?.Road_Name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Coordinates:</span>
                <span className="font-mono text-emerald-400">{selectedArea?.Latitude}° N, {selectedArea?.Longitude}° E</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Est. Local Population:</span>
                <span className="font-medium text-slate-200">{selectedArea?.Population?.toLocaleString()} residents</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1"><PhoneCall className="w-3.5 h-3.5 text-emerald-400" /> Village Contacts</span>
              <span className="text-[10px] text-amber-400 italic">Sample Contact Data</span>
            </div>
            <button
              onClick={() => onSelectAreaForReport && onSelectAreaForReport(selectedArea)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Report Abnormal Condition in {selectedArea?.Village}
            </button>
          </div>
        </div>

      </div>

      {/* 2. INTERACTIVE SIKKIM MAP & AI AGENT ANALYSIS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Interactive Map (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 border border-slate-700/60 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-3 px-2">
            <div>
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
                Live Sikkim Geospatial Map (Sikkim Landslide Telemetry)
              </h3>
              <p className="text-xs text-slate-400">
                Plotting 50 real Sikkim areas and 8 real historical landslide events (NIDM & Govt records).
              </p>
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <SikkimMap
              areas={areas}
              landslides={landslides}
              routes={routes}
              selectedArea={selectedArea}
              onSelectArea={setSelectedArea}
              onSelectLandslide={setSelectedLandslide}
            />
          </div>
        </div>

        {/* SlopeGuard Intelligence AI Agent Panel (1 Col) */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 flex flex-col justify-between space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-6 h-6 text-purple-400 animate-pulse" />
                <div>
                  <h3 className="font-bold text-lg text-slate-100">SlopeGuard Intelligence</h3>
                  <p className="text-[11px] text-purple-300">AI Risk Synthesis Engine</p>
                </div>
              </div>
              <button
                onClick={() => selectedArea && runAiAnalysis(selectedArea.Area_ID, telemetryOverride)}
                disabled={loadingAi}
                className="p-2 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 border border-purple-600/50 text-purple-300 transition"
                title="Re-run AI Analysis"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAi ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingAi ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                <p className="text-xs">Synthesizing telemetry & historical records...</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* AI Plain Language Explanation */}
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-slate-200 leading-relaxed">
                  <div className="font-bold text-purple-300 mb-1 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-purple-400" />
                    AI Agent Risk Synthesis
                  </div>
                  {aiAnalysis?.plainLanguageExplanation}
                </div>

                {/* Historical Event Cross Reference Citation */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300">
                  <span className="font-bold text-amber-400 block mb-1">
                    📜 Historical Event Citation ({aiAnalysis?.historicalEventsCount || 0} Events)
                  </span>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    {aiAnalysis?.historicalReferenceText}
                  </p>
                </div>

                {/* Recommended Actions */}
                <div>
                  <div className="font-bold text-slate-200 mb-2">Recommended Actions for Authorities:</div>
                  <ul className="space-y-1.5">
                    {aiAnalysis?.recommendedActions?.map((act, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 italic text-center">
            Prototype estimate only — requiring verification by disaster management authorities.
          </div>
        </div>

      </div>

      {/* 3. ENVIRONMENTAL SENSOR READINGS & DANGEROUS/SAFER ROUTES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Environmental Sensors Panel with Interactive Simulation Sliders */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-700/60 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-700 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-lg text-slate-100">Current Environmental Readings</h3>
              </div>
              <p className="text-xs text-slate-400">
                Telemetry baseline derived from area risk classification. Adjust sliders below to simulate severe monsoonal events.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold self-start md:self-auto">
              Simulated sensor data — prototype only
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Droplets className="w-4 h-4 text-blue-400" />
                Rainfall Intensity
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {telemetryOverride.rainfall_mm_hr} <span className="text-xs font-normal text-slate-400">mm/h</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Threshold: 40 mm/h</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Wind className="w-4 h-4 text-emerald-400" />
                Soil Moisture
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {telemetryOverride.soil_moisture_percent} <span className="text-xs font-normal text-slate-400">% Saturation</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Threshold: 70 %</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Activity className="w-4 h-4 text-orange-400" />
                Ground Movement
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {telemetryOverride.ground_movement_mm} <span className="text-xs font-normal text-slate-400">mm/24h</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Sensors: In-situ tiltmeters</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Compass className="w-4 h-4 text-purple-400" />
                Slope Gradient
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {telemetryOverride.slope_angle_deg} <span className="text-xs font-normal text-slate-400">degrees</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">DEM Topography</div>
            </div>
          </div>

          {/* Telemetry Simulator Controls */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Interactive Telemetry Simulator (Real-time AI Re-computation)
              </span>
              <span className="text-[10px] text-slate-400">Drag sliders to test risk changes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Simulate Monsoon Rainfall:</span>
                  <span className="font-mono text-blue-400 font-bold">{telemetryOverride.rainfall_mm_hr} mm/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={telemetryOverride.rainfall_mm_hr}
                  onChange={(e) => handleSliderChange('rainfall_mm_hr', e.target.value)}
                  className="w-full accent-blue-500 bg-slate-700 h-2 rounded cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 mb-1">
                  <span>Simulate Soil Water Saturation:</span>
                  <span className="font-mono text-emerald-400 font-bold">{telemetryOverride.soil_moisture_percent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={telemetryOverride.soil_moisture_percent}
                  onChange={(e) => handleSliderChange('soil_moisture_percent', e.target.value)}
                  className="w-full accent-emerald-500 bg-slate-700 h-2 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dangerous & Safer Routes Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-700/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-red-400" />
                Dangerous & Safer Routes
              </h3>
              <span className="text-[11px] text-slate-400">Sikkim Corridors</span>
            </div>

            <div className="space-y-3">
              {routes.map((rt) => (
                <div
                  key={rt.routeId}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    activeRoute?.routeId === rt.routeId
                      ? 'bg-slate-800 border-red-500/80 shadow-lg'
                      : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                  }`}
                  onClick={() => {
                    setActiveRoute(rt);
                    setShowSaferRouteModal(true);
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-200">{rt.roadName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      rt.riskLevel === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    }`}>
                      {rt.riskLevel}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2 line-clamp-2">{rt.dangerReason}</p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-700/50">
                    <span className="text-emerald-400 font-medium">Bypass: {rt.saferRoute?.name}</span>
                    <span className="text-slate-400 flex items-center gap-1 hover:text-white transition">
                      View Safer Route <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              if (routes.length > 0) {
                setActiveRoute(routes[0]);
                setShowSaferRouteModal(true);
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-semibold text-xs transition shadow-lg flex items-center justify-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            Find Safer Route Options
          </button>
        </div>

      </div>

      {/* 4. LIVE EMERGENCY ALERTS FEED */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-700/60">
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg text-slate-100">Live Disaster Warning Feed</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{alerts.length} Active Bulletins</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {alerts.map((alt) => (
            <div key={alt.id} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                  alt.type === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                }`}>
                  {alt.type}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-100">{alt.title}</h4>
              <p className="text-xs text-slate-300 leading-normal">{alt.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4.5. LIVE RESIDENT FIELD SUBMISSIONS FEED */}
      {reports.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-lg text-slate-100">Live Resident Field Submissions ({reports.length})</h3>
            </div>
            <span className="text-xs text-emerald-400 font-mono">Synced to Disaster Authority Review</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reports.slice(0, 4).map((rep) => (
              <div key={rep.reportId} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs shadow">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-emerald-400 font-bold">{rep.reportId}</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    rep.status === 'approved' || rep.status === 'alert_pushed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    rep.status === 'dismissed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {rep.status ? rep.status.replace('_', ' ').toUpperCase() : 'PENDING REVIEW'}
                  </span>
                </div>
                <div className="font-bold text-slate-100">{rep.reportType} — {rep.village} ({rep.roadName})</div>
                <p className="text-slate-300 line-clamp-2">{rep.description}</p>
                <div className="text-[10px] text-slate-400 font-mono pt-1 flex justify-between">
                  <span>Reporter: <strong>{rep.reporterName}</strong></span>
                  <span>{new Date(rep.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SAFER ROUTE MODAL DRAWER */}
      {showSaferRouteModal && activeRoute && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg text-white">Suggested Safer Route</h3>
              </div>
              <button
                onClick={() => setShowSaferRouteModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/40">
                <div className="font-bold text-red-300 mb-1">Dangerous Corridor:</div>
                <div className="text-sm font-semibold text-white">{activeRoute.roadName}</div>
                <div className="text-slate-400 mt-1">{activeRoute.dangerReason}</div>
                <div className="text-[11px] text-red-300 italic mt-1">{activeRoute.historicalReference}</div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-300 text-sm">Recommended Bypass:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                    +{activeRoute.saferRoute?.additionalTimeMinutes} mins travel time
                  </span>
                </div>
                <div className="text-base font-extrabold text-white">{activeRoute.saferRoute?.name}</div>
                <p className="text-slate-200 leading-relaxed">{activeRoute.saferRoute?.description}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSaferRouteModal(false)}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                Confirm Route Guidance
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
