import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import { SHIP_TYPES } from '../../state/gameState.js';

export default function FleetPanel() {
  const { state, dispatch } = useGame();
  const comercial = state.ships.filter((s) => s.kind === 'comercial');
  const militar = state.ships.filter((s) => s.kind === 'militar');

  return (
    <BottomSheet title="🚢 Flota" subtitle={`${comercial.length} comercial(es) · ${militar.length} militar(es)`} onClose={() => dispatch({ type: 'CLOSE_SHEET' })}>
      {state.ships.length > 0 && (
        <>
          <div className="section-label">Tu armada</div>
          {state.ships.map((sh) => {
            const t = SHIP_TYPES[sh.type];
            return <div className="row" key={sh.id}><span>{t.icon} {t.name}</span><span className="muted small">{t.kind === 'comercial' ? `📦 ${t.cargo}` : `⚔️ ${t.power}`}</span></div>;
          })}
        </>
      )}
      <div className="section-label">Astillero — Comercial</div>
      {Object.values(SHIP_TYPES).filter((t) => t.kind === 'comercial').map((t) => (
        <div className="row" key={t.id}>
          <span>{t.icon} {t.name} <span className="muted small">📦 {t.cargo} carga</span></span>
          <button className="btn small primary" disabled={state.oro < t.cost} onClick={() => dispatch({ type: 'BUILD_SHIP', shipType: t.id })}>{t.cost}🪙</button>
        </div>
      ))}
      <div className="section-label">Astillero — Militar</div>
      {Object.values(SHIP_TYPES).filter((t) => t.kind === 'militar').map((t) => (
        <div className="row" key={t.id}>
          <span>{t.icon} {t.name} <span className="muted small">⚔️ {t.power} poder</span></span>
          <button className="btn small primary" disabled={state.oro < t.cost} onClick={() => dispatch({ type: 'BUILD_SHIP', shipType: t.id })}>{t.cost}🪙</button>
        </div>
      ))}
      <p className="muted small" style={{ marginTop: 10 }}>La flota comercial moverá mercancía entre puertos; la militar defenderá tus rutas y atacará rivales. (Próximo paso: ponerlas a trabajar.)</p>
    </BottomSheet>
  );
}
