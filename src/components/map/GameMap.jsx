// ============================================================
// GAME MAP — la RED de vías es la protagonista (estilo Portugal/Irlanda).
// Vías siempre visibles: grosor por importancia, color por dueño.
// Puertos = puntos discretos (sin emoji), nombre al tocar.
// Tocar una vía → panel con el recurso que transporta + ir al mercado.
// ============================================================

import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import { useGame } from '../../state/GameContext.jsx';
import mapConfig from '../../config/map_config.json';
import world from '../../config/world_config.json';

const VIEW = world.worldView || { center: [20, -20], zoom: 3 };

// Color de una vía según su dueño / control.
function viaColor(node, ports) {
  if (node.owner === 'player' && (node.control || 0) >= 0.5) return mapConfig.playerColor;
  const port = ports.find((p) => p.id === node.portId);
  if (port && port.owner && port.owner !== 'player') return mapConfig.rivalColors[port.owner] || '#9aa6b0';
  // libre / sin trabajar: gris, algo más oscuro si la arteria es importante
  return '#8c98a3';
}

export default function GameMap() {
  const { state, dispatch } = useGame();

  return (
    <MapContainer center={VIEW.center} zoom={VIEW.zoom} minZoom={mapConfig.minZoom} maxZoom={mapConfig.maxZoom}
      zoomControl={false} attributionControl={false} worldCopyJump style={{ width: '100%', height: '100%' }}>
      <TileLayer url={mapConfig.tileLayer.url} />

      {/* ── RUTAS marítimas activas ── */}
      {state.seaRoutes.map((rt) => {
        const pts = rt.stops.map((id) => state.ports.find((p) => p.id === id)?.coords).filter(Boolean);
        if (pts.length < 2) return null;
        return <Polyline key={rt.id} positions={pts} pathOptions={{ color: '#1f6f9c', weight: 2, opacity: 0.7, dashArray: '10 8' }} />;
      })}

      {/* ── VÍAS (siempre visibles): grosor por importancia, color por dueño ── */}
      {state.nodes.map((n) => {
        const color = viaColor(n, state.ports);
        const owned = n.owner === 'player' && (n.control || 0) >= 0.5;
        const maxW = n.arteryWeight || 2.5;
        const pts = n.via;
        if (!pts || pts.length < 2) return null;
        // Segmentos con grosor decreciente: arteria (puerto) → capilar (nodo)
        const segs = [];
        for (let i = 0; i < pts.length - 1; i++) {
          const t = i / (pts.length - 2 || 1);              // 0 nodo, 1 puerto
          const weight = (1 + (maxW - 1) * t) * (owned ? 1.5 : 1);
          segs.push(
            <Polyline key={`${n.id}_s${i}`} positions={[pts[i], pts[i + 1]]}
              pathOptions={{ color, weight, opacity: owned ? 0.95 : 0.6 }}
              eventHandlers={{ click: () => dispatch({ type: 'SELECT_NODE', id: n.id }) }} />
          );
        }
        return <span key={`via_${n.id}`}>{segs}</span>;
      })}

      {/* ── PUERTOS: puntos discretos (sin emoji), nombre al tocar ── */}
      {state.ports.map((p) => {
        const color = p.owner === 'player' ? mapConfig.playerColor : p.owner ? (mapConfig.rivalColors[p.owner] || '#e05c5c') : '#55606b';
        return (
          <CircleMarker key={p.id} center={p.coords}
            radius={p.home ? 7 : 5}
            pathOptions={{ color: '#2a2f36', weight: 1.5, fillColor: color, fillOpacity: 0.95 }}
            eventHandlers={{ click: () => dispatch({ type: 'SELECT_PORT', id: p.id }) }}>
            <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>{p.name}</Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
