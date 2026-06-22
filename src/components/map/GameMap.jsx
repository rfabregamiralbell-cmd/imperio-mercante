// ============================================================
// GAME MAP — mapa base + capas reales (Tren OpenRailwayMap, Mar OpenSeaMap)
// + corredores marítimos + tramos jugables. Selector de capas flotante.
// ============================================================

import { useState } from 'react';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import { useGame } from '../../state/GameContext.jsx';
import mapConfig from '../../config/map_config.json';
import world from '../../config/world_config.json';

const VIEW = world.worldView || { center: [30, 0], zoom: 3 };

function segColor(seg, ports) {
  if (seg.owner === 'player' && (seg.control || 0) >= 0.5) return mapConfig.playerColor;
  const port = ports.find((p) => p.id === seg.portId);
  if (port && port.owner && port.owner !== 'player') return mapConfig.rivalColors[port.owner] || '#8c98a3';
  return '#8c98a3';
}

const LAYER_DEFS = [
  { key: 'rail', icon: '🚆', label: 'Tren' },
  { key: 'sea', icon: '⚓', label: 'Mar' },
  { key: 'corridors', icon: '🧭', label: 'Corredores' },
];

export default function GameMap() {
  const { state, dispatch } = useGame();
  const [layers, setLayers] = useState({ rail: true, sea: false, corridors: true });
  const toggle = (k) => setLayers((l) => ({ ...l, [k]: !l[k] }));

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Selector de capas flotante */}
      <div className="layer-control">
        {LAYER_DEFS.map((l) => (
          <button key={l.key} className={`layer-btn ${layers[l.key] ? 'on' : ''}`}
            onClick={() => toggle(l.key)} title={l.label}>
            <span className="layer-ic">{l.icon}</span>
            <span className="layer-lb">{l.label}</span>
          </button>
        ))}
      </div>

      <MapContainer center={VIEW.center} zoom={VIEW.zoom} minZoom={mapConfig.minZoom} maxZoom={mapConfig.maxZoom}
        zoomControl={false} attributionControl={false} worldCopyJump style={{ width: '100%', height: '100%' }}>
        <TileLayer url={mapConfig.tileLayer.url} />
        {layers.rail && mapConfig.railwayLayer && <TileLayer url={mapConfig.railwayLayer.url} opacity={0.55} />}
        {layers.sea && mapConfig.seaLayer && <TileLayer url={mapConfig.seaLayer.url} opacity={0.7} />}

        {/* Corredores marítimos (líneas náuticas entre puertos) */}
        {layers.corridors && world.seaCorridors?.map((c, i) => (
          <Polyline key={`corr_${i}`} positions={c.via}
            pathOptions={{ color: '#2f7fae', weight: 1.5, opacity: 0.5, dashArray: '2 7' }} />
        ))}

        {/* Rutas marítimas activas del jugador */}
        {state.seaRoutes.map((rt) => {
          const pts = rt.stops.map((id) => state.ports.find((p) => p.id === id)?.coords).filter(Boolean);
          if (pts.length < 2) return null;
          return <Polyline key={rt.id} positions={pts} pathOptions={{ color: '#1f6f9c', weight: 2.5, opacity: 0.85, dashArray: '10 8' }} />;
        })}

        {/* Tramos de vía jugables */}
        {state.segments.map((seg) => {
          const color = segColor(seg, state.ports);
          const owned = seg.owner === 'player' && (seg.control || 0) >= 0.5;
          const w = (seg.arteryWeight || 2.5) * (owned ? 1.5 : 1);
          if (!seg.via || seg.via.length < 2) return null;
          return (
            <Polyline key={seg.id} positions={seg.via}
              pathOptions={{ color, weight: w, opacity: owned ? 0.95 : 0.35 }}
              eventHandlers={{ click: () => dispatch({ type: 'SELECT_SEGMENT', id: seg.id }) }} />
          );
        })}

        {/* Puertos */}
        {state.ports.map((p) => {
          const color = p.owner === 'player' ? mapConfig.playerColor : p.owner ? (mapConfig.rivalColors[p.owner] || '#e05c5c') : '#55606b';
          return (
            <CircleMarker key={p.id} center={p.coords} radius={p.home ? 7 : 5}
              pathOptions={{ color: '#2a2f36', weight: 1.5, fillColor: color, fillOpacity: 0.95 }}
              eventHandlers={{ click: () => dispatch({ type: 'SELECT_PORT', id: p.id }) }}>
              <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>{p.name}</Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
