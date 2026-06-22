// ============================================================
// GAME MAP — real world map (Leaflet). Zones as colored pins;
// owned zones get an influence halo. Tap a pin to act.
// ============================================================

import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useGame } from '../../state/GameContext.jsx';
import mapConfig from '../../config/map_config.json';
import world from '../../config/world_config.json';

const ORIGIN_VIEW = world.worldView || { center: [25, -30], zoom: 3 };

function pinIcon(emoji, kind, home) {
  return L.divIcon({
    className: 'map-pin',
    html: `<div class="pin ${kind} ${home ? 'home' : ''}">${emoji}</div>`,
    iconSize: [34, 34], iconAnchor: [17, 17],
  });
}

// Slightly offset overlapping barrios of the same city so pins don't stack.
function spread(coords, index) {
  if (!index) return coords;
  const a = (index * 2.4) % (Math.PI * 2);
  return [coords[0] + Math.cos(a) * 0.55, coords[1] + Math.sin(a) * 0.55];
}

export default function GameMap() {
  const { state, dispatch } = useGame();

  // Group zones by city coords to spread barrios
  const seen = {};

  return (
    <MapContainer
      center={ORIGIN_VIEW.center}
      zoom={ORIGIN_VIEW.zoom}
      minZoom={mapConfig.minZoom}
      maxZoom={mapConfig.maxZoom}
      zoomControl={false}
      attributionControl={false}
      worldCopyJump
      style={{ width: '100%', height: '100%' }}
    >
      <TileLayer url={mapConfig.tileLayer.url} />

      {state.zones.map((z) => {
        const key = z.coords.join(',');
        const idx = seen[key] = (seen[key] ?? -1) + 1;
        const pos = spread(z.coords, idx);
        const kind = z.owner === 'player' ? 'player' : z.owner ? 'rival' : 'free';
        const color = z.owner === 'player' ? mapConfig.playerColor
          : z.owner ? (mapConfig.rivalColors[z.owner] || '#e05c5c') : '#4cc38a';
        const emoji = z.owner === 'player' ? '⚓' : z.kind === 'barrio' ? '🏘️' : '⛰️';
        return (
          <div key={z.id}>
            {z.owner === 'player' && (
              <Circle center={pos} radius={120000}
                pathOptions={{ color, weight: 1, opacity: 0.5, fillColor: color, fillOpacity: 0.12 }} />
            )}
            <Marker position={pos} icon={pinIcon(emoji, kind, z.home)}
              eventHandlers={{ click: () => dispatch({ type: 'SELECT_ZONE', id: z.id }) }} />
          </div>
        );
      })}
    </MapContainer>
  );
}
