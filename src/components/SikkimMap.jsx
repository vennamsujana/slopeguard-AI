import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Component to dynamically fit map bounds when selecting areas
function MapController({ selectedArea, areas }) {
  const map = useMap();
  useEffect(() => {
    if (selectedArea && selectedArea.Latitude && selectedArea.Longitude) {
      map.flyTo([selectedArea.Latitude, selectedArea.Longitude], 12, {
        animate: true,
        duration: 1.2
      });
    }
  }, [selectedArea, map]);
  return null;
}

// Custom DivIcons for modern glowing markers
const createCustomIcon = (colorClass, symbol = '') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg text-white font-bold text-xs ${colorClass} border-2 border-white/80">
        ${symbol}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

const redIcon = createCustomIcon('bg-red-600 glow-red pulse-critical', '🔴');
const orangeIcon = createCustomIcon('bg-orange-500 glow-orange', '🟠');
const yellowIcon = createCustomIcon('bg-amber-500 glow-yellow', '🟡');
const greenIcon = createCustomIcon('bg-emerald-500 glow-green', '🟢');
const historicalIcon = createCustomIcon('bg-purple-600 ring-2 ring-purple-300 shadow-purple-500/50', '⚡');

export default function SikkimMap({ areas = [], landslides = [], routes = [], selectedArea, onSelectArea, onSelectLandslide }) {
  // Center of Sikkim (Gangtok region approx 27.33° N, 88.61° E)
  const defaultCenter = [27.45, 88.55];
  const defaultZoom = 10;

  const getMarkerIcon = (riskLevel) => {
    switch (riskLevel?.toUpperCase()) {
      case 'CRITICAL': return redIcon;
      case 'HIGH': return orangeIcon;
      case 'MEDIUM':
      case 'MODERATE': return yellowIcon;
      case 'LOW': return greenIcon;
      default: return orangeIcon;
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Dark Matter / OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapController selectedArea={selectedArea} areas={areas} />

        {/* 1. Area Markers from real sikkim_area_data.csv */}
        {areas.map((area) => {
          if (!area.Latitude || !area.Longitude) return null;
          const isSelected = selectedArea?.Area_ID === area.Area_ID;

          return (
            <Marker
              key={area.Area_ID}
              position={[area.Latitude, area.Longitude]}
              icon={getMarkerIcon(area.Risk_Level)}
              eventHandlers={{
                click: () => onSelectArea && onSelectArea(area)
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                      {area.Area_ID}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${
                      area.Risk_Level === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                      area.Risk_Level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {area.Risk_Level} Risk
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-100 mb-1">{area.Village}</h4>
                  <p className="text-xs text-slate-400 mb-2">{area.District} District • {area.State}</p>
                  
                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Road Corridor:</span>
                      <span className="font-medium text-slate-200">{area.Road_Name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Road Status:</span>
                      <span className={`font-semibold ${area.Road_Status === 'Restricted' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {area.Road_Status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Population:</span>
                      <span className="font-medium text-slate-200">{area.Population?.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectArea && onSelectArea(area)}
                    className="w-full mt-3 py-1.5 px-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition shadow"
                  >
                    Run AI Risk Telemetry
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 2. Historical Landslide Event Markers from real sikkim_landslide_history.csv */}
        {landslides.map((ls) => {
          const lat = ls.Resolved_Latitude;
          const lng = ls.Resolved_Longitude;
          if (!lat || !lng) return null;

          return (
            <Marker
              key={ls.Landslide_ID}
              position={[lat, lng]}
              icon={historicalIcon}
              eventHandlers={{
                click: () => onSelectLandslide && onSelectLandslide(ls)
              }}
            >
              <Popup>
                <div className="p-1 max-w-[260px]">
                  <div className="flex items-center justify-between gap-1 border-b border-purple-900/50 pb-2 mb-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-700/50">
                      ⚡ {ls.Landslide_ID}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                      {ls.Date}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-purple-200 mb-1">{ls.Village}</h4>
                  <p className="text-xs text-slate-400 mb-2">
                    Source: <span className="text-slate-300 font-medium">{ls.Source}</span>
                  </p>

                  {ls.Is_Fallback_Coords && (
                    <div className="p-1.5 mb-2 rounded bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300">
                      ℹ️ Pre-GPS era record (NOT_REPORTED coords). Plotted using area center fallback.
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div>
                      <span className="text-purple-400 font-medium">Trigger:</span> {ls.Trigger}
                    </div>
                    <div>
                      <span className="text-purple-400 font-medium">Severity:</span>{' '}
                      {ls.Severity === 'NOT_REPORTED' ? (
                        <span className="text-slate-400 italic">Severity not recorded</span>
                      ) : (
                        <span className="text-red-400 font-bold">{ls.Severity}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-purple-400 font-medium">Recorded Damage:</span>{' '}
                      <span className="text-slate-200 text-[11px]">{ls.Damage}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 3. Dangerous & Safer Route Polylines */}
        {routes.map((rt) => {
          if (!rt.coordinates || rt.coordinates.length < 2) return null;
          const isHighRisk = rt.riskLevel === 'CRITICAL' || rt.riskLevel === 'HIGH';
          return (
            <Polyline
              key={rt.routeId}
              positions={rt.coordinates}
              pathOptions={{
                color: isHighRisk ? '#ef4444' : '#3b82f6',
                weight: isHighRisk ? 5 : 4,
                dashArray: isHighRisk ? '10, 10' : undefined,
                opacity: 0.85
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <h4 className="font-bold text-slate-100 text-sm mb-1">{rt.roadName}</h4>
                  <p className="text-red-400 font-semibold mb-1">Status: {rt.status}</p>
                  <p className="text-slate-300 mb-2">{rt.dangerReason}</p>
                  <div className="p-2 rounded bg-slate-800 border border-slate-700 text-emerald-400">
                    <strong>Suggested Bypass:</strong> {rt.saferRoute?.name} (+{rt.saferRoute?.additionalTimeMinutes} mins)
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-[1000] glass-panel p-3 rounded-lg border border-slate-700 shadow-xl text-xs space-y-1.5 text-slate-200 pointer-events-auto">
        <div className="font-semibold text-slate-100 border-b border-slate-700 pb-1 mb-1">Sikkim Risk Legend</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 glow-red"></span>
          <span>Critical / High Risk Area</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 glow-yellow"></span>
          <span>Moderate Risk Area</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-600"></span>
          <span>Historical Landslide Event</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-1 bg-red-500 rounded border-dashed"></span>
          <span>Dangerous Corridor</span>
        </div>
      </div>
    </div>
  );
}
