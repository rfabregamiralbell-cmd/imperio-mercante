// ============================================================
// GAME MAP — base + capas reales (tren/mar) + rutas navales (arcos) +
// VÍAS interiores (extracción) + puertos interactivos. Tocar abre panel.
// ============================================================

import { useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import { useGame } from '../../state/GameContext.jsx';
import mapConfig from '../../config/map_config.json';
import world from '../../config/world_config.json';
import { MATERIALS } from '../../engines/marketEngine.js';

const LAYERS = [
  { key: 'routes', icon: '🧭', label: 'Rutas' },
  { key: 'railway', icon: '🚆', label: 'Tren' },
  { key: 'sea', icon: '⚓', label: 'Mar' },
];

function arrowIcon(angleDeg, color) {
  return L.divIcon({ className: 'route-arrow', html: `<div style="transform:rotate(${angleDeg}deg);color:${color};font-size:16px;line-height:1">▶</div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
}
const bearing = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI;

const PLAYER = '#f4c430';
const RIVAL = '#c0506a';

export default function GameMap() {
  const { state, dispatch } = useGame();
  const [on, setOn] = useState({ routes: true, railway: false, sea: false });
  const toggle = (k) => setOn((s) => ({ ...s, [k]: !s[k] }));
  const portOwner = (id) => state.ports.find((p) => p.id === id)?.owner;

  return (
    <div className="map-root">
      <div className="layer-control">
        {LAYERS.map((l) => (
          <button key={l.key} className={`layer-btn ${on[l.key] ? 'on' : ''}`} onClick={() => toggle(l.key)} title={l.label}>
            <span className="layer-ic">{l.icon}</span><span className="layer-lb">{l.label}</span>
          </button>
        ))}
      </div>

      <MapContainer center={mapConfig.view.center} zoom={mapConfig.view.zoom}
        minZoom={mapConfig.minZoom} maxZoom={mapConfig.maxZoom}
        zoomControl={false} attributionControl={false} worldCopyJump
        style={{ width: '100%', height: '100%' }}>
        <TileLayer url={mapConfig.base.url} />
        {on.railway && <TileLayer url={mapConfig.railway.url} opacity={0.6} />}
        {on.sea && <TileLayer url={mapConfig.sea.url} opacity={0.7} />}

        {/* Rutas navales (arcos por océano) */}
        {on.routes && world.seaRoutes.map((r, i) => {
          const last = r.path[r.path.length - 1], prev = r.path[r.path.length - 2];
          return (
            <span key={`r_${i}`}>
              <Polyline positions={r.path} pathOptions={{ color: '#fff', weight: 6, opacity: 0.3 }} />
              <Polyline positions={r.path} pathOptions={{ color: r.color, weight: 3.5, opacity: 0.85 }} />
              <Marker position={last} icon={arrowIcon(bearing(prev, last), r.color)} interactive={false} />
            </span>
          );
        })}

        {/* VÍAS interiores (extracción) — color por dueño, clicables */}
        {state.vias.map((v) => {
          const wv = world.vias.find((x) => x.id === v.id);
          if (!wv) return null;
          const mine = v.owner === 'player';
          return (
            <Polyline key={v.id} positions={wv.via}
              pathOptions={{ color: mine ? PLAYER : '#8c98a3', weight: mine ? 3.5 : 2, opacity: mine ? 0.95 : 0.5 }}
              eventHandlers={{ click: () => dispatch({ type: 'SELECT_VIA', id: v.id }) }} />
          );
        })}

        {/* Nodos interiores (origen de vía) */}
        {state.vias.map((v) => {
          const wv = world.vias.find((x) => x.id === v.id);
          if (!wv) return null;
          return (
            <CircleMarker key={`n_${v.id}`} center={wv.coords} radius={3}
              pathOptions={{ color: '#5a4a2a', weight: 1, fillColor: v.owner === 'player' ? PLAYER : '#7a6a4a', fillOpacity: 1 }}
              eventHandlers={{ click: () => dispatch({ type: 'SELECT_VIA', id: v.id }) }}>
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>{wv.name} · {MATERIALS[v.material].icon}</Tooltip>
            </CircleMarker>
          );
        })}

        {/* Puertos (interactivos) */}
        {state.ports.map((p) => {
          const fill = p.owner === 'player' ? PLAYER : p.owner ? RIVAL : '#2b333b';
          return (
            <CircleMarker key={p.id} center={p.coords} radius={p.home ? 6 : 4}
              pathOptions={{ color: '#1c2329', weight: 1.5, fillColor: fill, fillOpacity: 1 }}
              eventHandlers={{ click: () => dispatch({ type: 'SELECT_PORT', id: p.id }) }}>
              <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>{p.name}</Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
