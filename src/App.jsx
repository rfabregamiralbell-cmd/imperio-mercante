// ============================================================
// APP — Imperio Mercante: mapa + comercio + flota (primer bucle).
// ============================================================

import { useGame } from './state/GameContext.jsx';
import GameMap from './components/map/GameMap.jsx';
import TopHUD from './components/ui/TopHUD.jsx';
import BottomNav from './components/ui/BottomNav.jsx';
import Notifications from './components/ui/Notifications.jsx';
import PortPanel from './components/panels/PortPanel.jsx';
import ViaPanel from './components/panels/ViaPanel.jsx';
import FleetPanel from './components/panels/FleetPanel.jsx';

const OCEANS = [
  { color: '#E08A3C', label: 'Atlántico' },
  { color: '#1F5E8C', label: 'Índico' },
  { color: '#B23A2E', label: 'Pacífico' },
];

export default function App() {
  const { state } = useGame();
  const sheet = state.ui.sheet;
  return (
    <div className="app-root">
      <GameMap />
      <TopHUD />
      <Notifications />
      <BottomNav />

      <div className="legend">
        <div className="legend-title">Rutas oceánicas</div>
        {OCEANS.map((o) => (
          <div className="legend-row" key={o.label}><span className="legend-swatch" style={{ background: o.color }} /><span>{o.label}</span></div>
        ))}
      </div>

      {sheet === 'port' && <PortPanel />}
      {sheet === 'via' && <ViaPanel />}
      {sheet === 'fleet' && <FleetPanel />}
    </div>
  );
}
