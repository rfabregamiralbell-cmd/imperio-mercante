// ============================================================
// GAME MAP — base map + real layers (OpenRailwayMap, OpenSeaMap).
// Floating layer selector to toggle each layer. This is the
// foundation; game mechanics will be built on top later.
// ============================================================

import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import mapConfig from '../../config/map_config.json';

const LAYERS = [
  { key: 'railway', icon: '🚆', label: 'Tren' },
  { key: 'sea', icon: '⚓', label: 'Mar' },
];

export default function GameMap() {
  const [on, setOn] = useState({ railway: true, sea: false });
  const toggle = (k) => setOn((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="map-root">
      <div className="layer-control">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            className={`layer-btn ${on[l.key] ? 'on' : ''}`}
            onClick={() => toggle(l.key)}
            title={l.label}
          >
            <span className="layer-ic">{l.icon}</span>
            <span className="layer-lb">{l.label}</span>
          </button>
        ))}
      </div>

      <MapContainer
        center={mapConfig.view.center}
        zoom={mapConfig.view.zoom}
        minZoom={mapConfig.minZoom}
        maxZoom={mapConfig.maxZoom}
        zoomControl={false}
        attributionControl={false}
        worldCopyJump
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url={mapConfig.base.url} />
        {on.railway && <TileLayer url={mapConfig.railway.url} opacity={0.6} />}
        {on.sea && <TileLayer url={mapConfig.sea.url} opacity={0.7} />}
      </MapContainer>
    </div>
  );
}
