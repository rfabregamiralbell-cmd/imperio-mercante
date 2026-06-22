// ============================================================
// GAME MAP — base + capas reales (tren/mar) + RUTAS NAVALES 2D
// estilo UNESCO: arcos gruesos de color por océano, con flecha de
// dirección y puntas de puerto etiquetadas. Selector de capas.
// ============================================================

import { useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import mapConfig from '../../config/map_config.json';
import world from '../../config/world_config.json';

const LAYERS = [
  { key: 'routes', icon: '🧭', label: 'Rutas' },
  { key: 'railway', icon: '🚆', label: 'Tren' },
  { key: 'sea', icon: '⚓', label: 'Mar' },
];

// Flecha (divIcon) orientada según el rumbo final de la ruta.
function arrowIcon(angleDeg, color) {
  return L.divIcon({
    className: 'route-arrow',
    html: `<div style="transform:rotate(${angleDeg}deg);color:${color};font-size:18px;line-height:1">▶</div>`,
    iconSize: [18, 18], iconAnchor: [9, 9],
  });
}
function bearing(a, b) {
  const dy = b[0] - a[0], dx = b[1] - a[1];
  return Math.atan2(dy, dx) * 180 / Math.PI; // 0 = hacia el este; ▶ apunta al este
}

export default function GameMap() {
  const [on, setOn] = useState({ routes: true, railway: false, sea: false });
  const toggle = (k) => setOn((s) => ({ ...s, [k]: !s[k] }));
  const portById = (id) => world.ports.find((p) => p.id === id);

  return (
    <div className="map-root">
      <div className="layer-control">
        {LAYERS.map((l) => (
          <button key={l.key} className={`layer-btn ${on[l.key] ? 'on' : ''}`} onClick={() => toggle(l.key)} title={l.label}>
            <span className="layer-ic">{l.icon}</span>
            <span className="layer-lb">{l.label}</span>
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

        {/* ── RUTAS NAVALES (arcos gruesos por océano) ── */}
        {on.routes && world.seaRoutes.map((r, i) => {
          const path = r.path;
          const last = path[path.length - 1];
          const prev = path[path.length - 2];
          const ang = bearing(prev, last);
          return (
            <span key={`r_${i}`}>
              {/* halo claro debajo para dar cuerpo al arco */}
              <Polyline positions={path} pathOptions={{ color: '#ffffff', weight: 7, opacity: 0.35 }} />
              <Polyline positions={path} pathOptions={{ color: r.color, weight: 4, opacity: 0.9 }} />
              <Marker position={last} icon={arrowIcon(ang, r.color)} interactive={false} />
            </span>
          );
        })}

        {/* ── PUERTOS (puntos discretos con etiqueta) ── */}
        {world.ports.map((p) => (
          <CircleMarker key={p.id} center={p.coords} radius={4}
            pathOptions={{ color: '#1c2329', weight: 1.5, fillColor: '#2b333b', fillOpacity: 1 }}>
            <Tooltip direction="top" offset={[0, -5]} opacity={0.95}>{p.name}</Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
