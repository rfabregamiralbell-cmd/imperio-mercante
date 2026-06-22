// ============================================================
// WORLD PANEL — map legend + quick guidance (trade model)
// ============================================================

import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';

export default function WorldPanel() {
  const { state, dispatch } = useGame();
  const mine = state.zones.filter((z) => z.owner === 'player').length;
  const rivals = state.zones.filter((z) => z.owner && z.owner !== 'player').length;
  const free = state.zones.filter((z) => z.owner === null).length;
  const tradedZones = state.zones.filter((z) => (z.influence || 0) > 0).length;

  return (
    <BottomSheet title="🌍 Mundo" subtitle="Toca una zona del mapa para comerciar" onClose={() => dispatch({ type: 'CLOSE_SHEET' })}>
      <div className="row"><span>⚓ Zonas tuyas</span><span className="good">{mine}</span></div>
      <div className="row"><span>· Libres</span><span>{free}</span></div>
      <div className="row"><span>⚑ Rivales</span><span className="bad">{rivals}</span></div>
      <div className="row"><span>🚩 Zonas donde tienes influencia</span><span>{tradedZones}</span></div>

      <div className="section-label">Cómo se juega</div>
      <p className="muted small">
        Cada zona tiene un <b>mercado</b> con precios que suben y bajan según oferta y demanda. Compra barato donde sobra un material
        y véndelo caro donde escasea. Toca una zona para ver su mercado.
      </p>
      <p className="muted small" style={{ marginTop: 8 }}>
        Crea <b>rutas</b> 🧭 para que tus barcos comercien solos. Pide <b>crédito</b> 🏦 para invertir.
        Cuanto más comercias en una zona, más <b>influencia</b> ganas allí y mejores precios consigues.
        Las zonas <b className="bad">rivales</b> se toman con tu <b>flota</b> 🚢.
      </p>
    </BottomSheet>
  );
}
