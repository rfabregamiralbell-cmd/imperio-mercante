// ============================================================
// GAME MAP — dos capas: vías terrestres (interior→puerto) iluminadas con
// el color del dueño + puertos (mercado) + nodos interiores + rutas marítimas.
// ============================================================

import { MapContainer, TileLayer, Marker, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useGame } from '../../state/GameContext.jsx';
import mapConfig from '../../config/map_config.json';
import world from '../../config/world_config.json';

const VIEW = world.worldView || { center: [20, -20], zoom: 3 };

function pin(emoji, kind, home) {
  return L.divIcon({ className: 'map-pin', html: `<div class="pin ${kind} ${home ? 'home' : ''}">${emoji}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
}
function nodePin(emoji, owned) {
  return L.divIcon({ className: 'map-pin', html: `<div class="pin node ${owned ? 'owned' : ''}">${emoji}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });
}

const MAT_ICON = world.materials;

export default function GameMap() {
  const { state, dispatch } = useGame();
  const portColor = (p) => p.owner === 'player' ? mapConfig.playerColor : p.owner ? (mapConfig.rivalColors[p.owner] || '#e05c5c') : '#7a8a99';

  return (
    <MapContainer center={VIEW.center} zoom={VIEW.zoom} minZoom={mapConfig.minZoom} maxZoom={mapConfig.maxZoom}
      zoomControl={false} attributionControl={false} worldCopyJump style={{ width: '100%', height: '100%' }}>
      <TileLayer url={mapConfig.tileLayer.url} />

      {/* ── VÍAS terrestres: iluminadas con el color del dueño ── */}
      {state.nodes.map((n) => {
        const port = state.ports.find((p) => p.id === n.portId);
        const owned = n.owner === 'player' && (n.control || 0) >= 0.5;
        const color = owned ? mapConfig.playerColor : (n.control > 0 ? '#c9a227' : '#5a6a78');
        return (
          <Polyline key={`via_${n.id}`} positions={n.via}
            pathOptions={{ color, weight: owned ? 3.5 : 2, opacity: owned ? 0.95 : 0.5, dashArray: owned ? null : '5 7' }} />
        );
      })}

      {/* ── RUTAS marítimas activas ── */}
      {state.seaRoutes.map((rt) => {
        const pts = rt.stops.map((id) => state.ports.find((p) => p.id === id)?.coords).filter(Boolean);
        if (pts.length < 2) return null;
        return <Polyline key={rt.id} positions={pts} pathOptions={{ color: '#3da5d9', weight: 2.5, opacity: 0.8, dashArray: '10 8' }} />;
      })}

      {/* ── NODOS interiores ── */}
      {state.nodes.map((n) => {
        const owned = n.owner === 'player' && (n.control || 0) >= 0.5;
        return (
          <Marker key={n.id} position={n.coords} icon={nodePin(MAT_ICON[n.material]?.icon || '⛏️', owned)}
            eventHandlers={{ click: () => dispatch({ type: 'SELECT_NODE', id: n.id }) }} />
        );
      })}

      {/* ── PUERTOS + halo de influencia ── */}
      {state.ports.map((p) => {
        const kind = p.owner === 'player' ? 'player' : p.owner ? 'rival' : 'free';
        return (
          <span key={p.id}>
            {p.owner === 'player' && (
              <Circle center={p.coords} radius={150000} pathOptions={{ color: mapConfig.playerColor, weight: 1, opacity: 0.45, fillColor: mapConfig.playerColor, fillOpacity: 0.1 }} />
            )}
            <Marker position={p.coords} icon={pin('⚓', kind, p.home)}
              eventHandlers={{ click: () => dispatch({ type: 'SELECT_PORT', id: p.id }) }} />
          </span>
        );
      })}
    </MapContainer>
  );
}
