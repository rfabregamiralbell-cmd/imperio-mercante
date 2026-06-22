// ============================================================
// EMPIRE PANEL — influence overview + owned zones + expansion
// ============================================================

import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import { ownedZones, influencePerCycle, materialsPerCycle, expansionCost } from '../../engines/influenceEngine.js';

export default function EmpirePanel() {
  const { state, dispatch } = useGame();
  const { zones, resources } = state;
  const mine = ownedZones(zones);
  const inflRate = influencePerCycle(zones);
  const mats = materialsPerCycle(zones);
  const free = zones.filter((z) => z.owner === null);

  return (
    <BottomSheet title="🏛️ Imperio" subtitle={`${mine.length} zonas · +${inflRate}🚩/ciclo`} onClose={() => dispatch({ type: 'CLOSE_SHEET' })}>
      <div className="section-label">Producción por ciclo</div>
      {Object.keys(mats).length === 0
        ? <p className="muted small">Sin zonas productivas. Expándete a nuevas zonas.</p>
        : Object.entries(mats).map(([m, v]) => (
            <div className="row" key={m}><span className="muted">{resources[m]?.icon} {resources[m]?.label}</span><span className="good">+{v}/ciclo</span></div>
          ))}

      <div className="section-label">Tus zonas</div>
      {mine.map((z) => (
        <div className="row" key={z.id}>
          <span>{z.kind === 'barrio' ? '🏘️' : '⛰️'} {z.name} <span className="muted small">{z.cityName || 'comarca'}</span></span>
          <span className="muted">{resources[z.material]?.icon} {resources[z.material]?.label}</span>
        </div>
      ))}

      <div className="section-label">Expandir (zonas libres)</div>
      {free.length === 0 && <p className="muted small">No quedan zonas libres. Disputa zonas rivales con tu flota desde el Mundo.</p>}
      <div className="card-grid">
        {free.map((z) => {
          const cost = expansionCost(z);
          const afford = resources.influencia.amount >= cost.influencia && resources.oro.amount >= cost.oro;
          return (
            <div key={z.id} className={`card ${afford ? 'ready' : ''}`}>
              <div className="card-head">
                <span className="card-icon">{z.kind === 'barrio' ? '🏘️' : '⛰️'}</span>
                <div>
                  <div className="card-name">{z.name}</div>
                  <div className="card-desc">{z.cityName || 'Comarca'} · produce {resources[z.material]?.icon} {resources[z.material]?.label}</div>
                </div>
              </div>
              <button className="btn primary block" disabled={!afford}
                onClick={() => dispatch({ type: 'EXPAND_ZONE', zoneId: z.id })}>
                Reclamar · <span className={resources.influencia.amount >= cost.influencia ? '' : 'cant'}>🚩{cost.influencia}</span>
                <span className={resources.oro.amount >= cost.oro ? '' : 'cant'}>🪙{cost.oro}</span>
              </button>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}
