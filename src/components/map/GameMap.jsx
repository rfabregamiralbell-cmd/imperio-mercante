// ============================================================
// GAME MAP — carreteras reales del mapa base + vías iluminadas encima.
// Los puertos siempre visibles. Las vías interiores se REVELAN al
// seleccionar un puerto, e iluminan PROGRESIVAMENTE según tu control.
// Arteria gruesa cerca del puerto, capilar fino cerca del nodo interior.
// ============================================================

import { MapContainer, TileLayer, Marker, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useGame } from '../../state/GameContext.jsx';
import mapConfig from '../../config/map_config.json';
import world from '../../config/world_config.json';

const VIEW = world.worldView || { center: [20, -20], zoom: 3 };
const MAT = world.materials;

function pin(emoji, kind, home) {
  return L.divIcon({ className: 'map-pin', html: `<div class="pin ${kind} ${home ? 'home' : ''}">${emoji}</div>`, iconSize: [32, 32], iconAnchor: [16, 16] });
}
function nodePin(emoji, owned) {
  return L.divIcon({ className: 'map-pin', html: `<div class="pin node ${owned ? 'owned' : ''}">${emoji}</div>`, iconSize: [26, 26], iconAnchor: [13, 13] });
}

// Interpola color gris→dorado según control 0..1
function viaColor(control) {
  if (control <= 0) return '#9aa6b0';
  // gris -> oro
  const g = [154, 166, 176], o = [244, 196, 48];
  const c = Math.min(1, control);
  const mix = g.map((v, i) => Math.round(v + (o[i] - v) * c));
  return `rgb(${mix[0]},${mix[1]},${mix[2]})`;
}

// Dibuja una vía como segmentos con grosor decreciente (arteria→capilar)
// y opacidad/color según control. via[0] = nodo interior, via[last] = puerto.
function ViaLine({ node, control }) {
  const pts = node.via;
  if (!pts || pts.length < 2) return null;
  const color = viaColor(control);
  const owned = control >= 0.5;
  const maxW = node.arteryWeight || 2.5;
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    // t=0 en el nodo (capilar fino), t=1 en el puerto (arteria gruesa)
    const t = i / (pts.length - 2 || 1);
    const weight = 1 + (maxW - 1) * t;
    segs.push(
      <Polyline key={`${node.id}_s${i}`} positions={[pts[i], pts[i + 1]]}
        pathOptions={{ color, weight: owned ? weight + 0.8 : weight, opacity: control > 0 ? 0.55 + control * 0.4 : 0.45, dashArray: control > 0 ? null : '4 6' }} />
    );
  }
  return <>{segs}</>;
}

export default function GameMap() {
  const { state, dispatch } = useGame();
  const selectedPortId = state.map.selectedPortId;

  return (
    <MapContainer center={VIEW.center} zoom={VIEW.zoom} minZoom={mapConfig.minZoom} maxZoom={mapConfig.maxZoom}
      zoomControl={false} attributionControl={false} worldCopyJump style={{ width: '100%', height: '100%' }}>
      <TileLayer url={mapConfig.tileLayer.url} />

      {/* ── RUTAS marítimas activas ── */}
      {state.seaRoutes.map((rt) => {
        const pts = rt.stops.map((id) => state.ports.find((p) => p.id === id)?.coords).filter(Boolean);
        if (pts.length < 2) return null;
        return <Polyline key={rt.id} positions={pts} pathOptions={{ color: '#1f6f9c', weight: 2.5, opacity: 0.8, dashArray: '10 8' }} />;
      })}

      {/* ── VÍAS del puerto seleccionado (reveladas) ── */}
      {selectedPortId && state.nodes.filter((n) => n.portId === selectedPortId).map((n) => (
        <ViaLine key={`via_${n.id}`} node={n} control={n.owner === 'player' ? (n.control || 0) : (n.control || 0)} />
      ))}

      {/* Vías ya controladas por el jugador: visibles SIEMPRE (iluminadas) */}
      {state.nodes.filter((n) => n.owner === 'player' && (n.control || 0) >= 0.5 && n.portId !== selectedPortId).map((n) => (
        <ViaLine key={`owned_${n.id}`} node={n} control={n.control || 0} />
      ))}

      {/* ── NODOS interiores del puerto seleccionado ── */}
      {selectedPortId && state.nodes.filter((n) => n.portId === selectedPortId).map((n) => {
        const owned = n.owner === 'player' && (n.control || 0) >= 0.5;
        return (
          <Marker key={n.id} position={n.coords} icon={nodePin(MAT[n.material]?.icon || '⛏️', owned)}
            eventHandlers={{ click: () => dispatch({ type: 'SELECT_NODE', id: n.id }) }} />
        );
      })}

      {/* ── PUERTOS (siempre visibles) ── */}
      {state.ports.map((p) => {
        const kind = p.owner === 'player' ? 'player' : p.owner ? 'rival' : 'free';
        return (
          <span key={p.id}>
            {p.owner === 'player' && (
              <Circle center={p.coords} radius={140000} pathOptions={{ color: mapConfig.playerColor, weight: 1, opacity: 0.4, fillColor: mapConfig.playerColor, fillOpacity: 0.08 }} />
            )}
            <Marker position={p.coords} icon={pin('⚓', kind, p.home)}
              eventHandlers={{ click: () => dispatch({ type: 'SELECT_PORT', id: p.id }) }} />
          </span>
        );
      })}
    </MapContainer>
  );
}
