// ============================================================
// APP — Imperio Mercante. Base: mapa mundi a pantalla completa
// con capas reales de tren y mar. Las mecánicas se añaden después.
// ============================================================

import GameMap from './components/map/GameMap.jsx';

export default function App() {
  return (
    <div className="app-root">
      <GameMap />
    </div>
  );
}
