// ============================================================
// APP — Imperio Mercante root (trade model)
// ============================================================

import { useGame } from './state/GameContext.jsx';
import GameMap from './components/map/GameMap.jsx';
import TopHUD from './components/ui/TopHUD.jsx';
import BottomNav from './components/ui/BottomNav.jsx';
import Notifications from './components/ui/Notifications.jsx';
import WorldPanel from './components/panels/WorldPanel.jsx';
import RoutesPanel from './components/panels/RoutesPanel.jsx';
import FleetPanel from './components/panels/FleetPanel.jsx';
import BankPanel from './components/panels/BankPanel.jsx';
import ZonePanel from './components/panels/ZonePanel.jsx';
import { DuelPanel, BattleReport } from './components/panels/WorldPanels.jsx';

export default function App() {
  const { state } = useGame();
  const sheet = state.ui.openSheet;
  return (
    <div className="app-root">
      <div className="map-wrap"><GameMap /></div>
      <TopHUD />
      <Notifications />
      <BottomNav />

      {sheet === 'world' && <WorldPanel />}
      {sheet === 'routes' && <RoutesPanel />}
      {sheet === 'fleet' && <FleetPanel />}
      {sheet === 'bank' && <BankPanel />}
      {sheet === 'zone' && <ZonePanel />}
      {sheet === 'duel' && <DuelPanel />}

      <BattleReport />
    </div>
  );
}
