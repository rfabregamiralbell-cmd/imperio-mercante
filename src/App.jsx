// ============================================================
// APP — Imperio Mercante. Mapa mundi + rutas navales (estilo UNESCO)
// + capas reales de tren y mar. Mecánicas se añaden encima después.
// ============================================================

import GameMap from './components/map/GameMap.jsx';

const OCEANS = [
  { color: '#E08A3C', label: 'Atlántico' },
  { color: '#1F5E8C', label: 'Índico' },
  { color: '#B23A2E', label: 'Pacífico (Galeón de Manila)' },
];

export default function App() {
  return (
    <div className="app-root">
      <GameMap />
      <div className="legend">
        <div className="legend-title">Rutas oceánicas</div>
        {OCEANS.map((o) => (
          <div className="legend-row" key={o.label}>
            <span className="legend-swatch" style={{ background: o.color }} />
            <span>{o.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
