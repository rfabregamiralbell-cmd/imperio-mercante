// ============================================================
// WORLD PANEL — map legend + quick guidance
// ============================================================

import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import { ownedZones } from '../../engines/influenceEngine.js';

export default function WorldPanel() {
  const { state, dispatch } = useGame();
  const mine = ownedZones(state.zones).length;
  const rivals = state.zones.filter((z) => z.owner && z.owner !== 'player').length;
  const free = state.zones.filter((z) => z.owner === null).length;

  return (
    <BottomSheet title="🌍 Mundo" subtitle="Toca una zona del mapa para actuar" onClose={() => dispatch({ type: 'CLOSE_SHEET' })}>
      <div className="row"><span><span className="pin player" style={{ display: 'inline-flex', width: 22, height: 22, fontSize: 12, verticalAlign: 'middle' }}>⚓</span> Tuyas</span><span className="good">{mine}</span></div>
      <div className="row"><span><span className="pin free" style={{ display: 'inline-flex', width: 22, height: 22, fontSize: 12, verticalAlign: 'middle' }}>·</span> Libres</span><span>{free}</span></div>
      <div className="row"><span><span className="pin rival" style={{ display: 'inline-flex', width: 22, height: 22, fontSize: 12, verticalAlign: 'middle' }}>⚑</span> Rivales</span><span className="bad">{rivals}</span></div>
      <p className="muted small" style={{ marginTop: 12 }}>
        Las zonas <b className="good">libres</b> se reclaman con influencia y oro. Las <b className="bad">rivales</b> exigen un duelo de flotas.
        Cuantas más zonas controles, más materiales extraes para comerciar.
      </p>
      <p className="muted small" style={{ marginTop: 8 }}>
        Pellizca para acercar el mapa: las grandes ciudades se dividen en barrios; fuera hay comarcas con recursos propios.
      </p>
    </BottomSheet>
  );
}
