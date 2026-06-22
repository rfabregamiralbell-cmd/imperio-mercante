// ============================================================
// APP — Imperio Mercante root layout
// ============================================================

import { useGame } from './state/GameContext.jsx';
import GameMap from './components/map/GameMap.jsx';
import TopHUD from './components/ui/TopHUD.jsx';
import BottomNav from './components/ui/BottomNav.jsx';
import Notifications from './components/ui/Notifications.jsx';
import EmpirePanel from './components/panels/EmpirePanel.jsx';
import TradePanel from './components/panels/TradePanel.jsx';
import FleetPanel from './components/panels/FleetPanel.jsx';
import WorldPanel from './components/panels/WorldPanel.jsx';
import { ZonePanel, DuelPanel, BattleReport } from './components/panels/WorldPanels.jsx';

export default function App() {
  const { state } = useGame();
  const sheet = state.ui.openSheet;

  return (
    <div className="app-root">
      <div className="map-wrap"><GameMap /></div>

      <TopHUD />
      <Notifications />
      <BottomNav />

      {sheet === 'empire' && <EmpirePanel />}
      {sheet === 'trade' && <TradePanel />}
      {sheet === 'fleet' && <FleetPanel />}
      {sheet === 'world' && <WorldPanel />}
      {sheet === 'zone' && <ZonePanel />}
      {sheet === 'duel' && <DuelPanel />}

      <BattleReport />
    </div>
  );
}
