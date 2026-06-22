// ============================================================
// GAME MAP — mapa base claro + CAPA OpenRailwayMap (vías reales) +
// nuestros tramos jugables encima (gris = red; color = lo que controlas).
// Puertos = puntos discretos (nombre al tocar). Tocar tramo → panel.
// ============================================================

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

export default function GameMap() {
  const { state, dispatch } = useGame();

  return (
    <MapContainer center={VIEW.center} zoom={VIEW.zoom} minZoom={mapConfig.minZoom} maxZoom={mapConfig.maxZoom}
      zoomControl={false} attributionControl={false} worldCopyJump style={{ width: '100%', height: '100%' }}>
      {/* Mapa base claro */}
      <TileLayer url={mapConfig.tileLayer.url} />
      {/* Capa de vías ferroviarias REALES (OpenRailwayMap) */}
      {mapConfig.railwayLayer && (
        <TileLayer url={mapConfig.railwayLayer.url} opacity={0.55} />
      )}

      {/* ── RUTAS marítimas activas ── */}
      {state.seaRoutes.map((rt) => {
        const pts = rt.stops.map((id) => state.ports.find((p) => p.id === id)?.coords).filter(Boolean);
        if (pts.length < 2) return null;
        return <Polyline key={rt.id} positions={pts} pathOptions={{ color: '#1f6f9c', weight: 2, opacity: 0.7, dashArray: '10 8' }} />;
      })}

      {/* ── TRAMOS de vía jugables (gris; color solo si los controlas) ── */}
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

      {/* ── PUERTOS: puntos discretos, nombre al tocar ── */}
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
  );
}
