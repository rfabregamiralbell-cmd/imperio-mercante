// ============================================================
// FLEET PANEL — build ships, inspect/upgrade/repair
// ============================================================

import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import shipsConfig from '../../config/ships_config.json';
import { effectiveStats, fleetPower, shipPower } from '../../engines/fleetEngine.js';

export default function FleetPanel() {
  const { state, dispatch } = useGame();
  const { ships, resources } = state;
  const [sel, setSel] = useState(null);
  const selShip = ships.find((s) => s.id === sel);

  const cost = (c) => Object.entries(c).map(([r, v]) => (
    <span key={r} className={(resources[r]?.amount ?? 0) >= v ? '' : 'cant'}>{resources[r]?.icon || r}{v} </span>
  ));

  return (
    <BottomSheet title="🚢 Flota" subtitle={`${ships.length} barcos · poder total ${fleetPower(ships)}`} onClose={() => dispatch({ type: 'CLOSE_SHEET' })}>
      {ships.length > 0 && (
        <>
          <div className="section-label">Tu armada</div>
          {ships.map((s) => {
            const st = effectiveStats(s);
            const hp = Math.round((s.hpPct ?? 1) * 100);
            return (
              <div key={s.id} className={`select-row ${sel === s.id ? 'sel' : ''}`} onClick={() => setSel(sel === s.id ? null : s.id)}>
                <span>{s.icon} <b>{s.name}</b> <span className="muted small">{shipsConfig.ships.find((d) => d.id === s.configId)?.name}</span></span>
                <span className="muted small">⚔️{shipPower(s)} · ❤️{hp}%</span>
              </div>
            );
          })}
        </>
      )}

      {selShip && (
        <div className="card" style={{ marginTop: 8 }}>
          <div className="card-name">{selShip.icon} {selShip.name}</div>
          {(() => { const st = effectiveStats(selShip); return (
            <div className="card-meta">🪵 Casco {st.casco} · 💣 Cañones {st.canones} · ⛵ Vel {st.velocidad} · 📦 Bodega {st.bodega}</div>
          ); })()}
          <div className="section-label">Mejoras</div>
          {shipsConfig.upgrades.map((u) => {
            const lvl = selShip.upgrades?.[u.id] || 0;
            const maxed = lvl >= u.max;
            const c = {}; Object.entries(u.costPerLevel).forEach(([r, v]) => { c[r] = v * (lvl + 1); });
            const afford = Object.entries(c).every(([r, v]) => (resources[r]?.amount ?? 0) >= v);
            return (
              <div className="row" key={u.id}>
                <span>{u.icon} {u.name} <span className="muted small">Nv {lvl}/{u.max}</span></span>
                <button className="btn small" disabled={maxed || !afford}
                  onClick={() => dispatch({ type: 'UPGRADE_SHIP', shipId: selShip.id, upgradeId: u.id })}>
                  {maxed ? 'Máx' : <>Mejorar {cost(c)}</>}
                </button>
              </div>
            );
          })}
          {(selShip.hpPct ?? 1) < 1 && (
            <button className="btn block" style={{ marginTop: 8 }} onClick={() => dispatch({ type: 'REPAIR_SHIP', shipId: selShip.id })}>
              🔧 Reparar (🪙60 🪵30)
            </button>
          )}
        </div>
      )}

      <div className="section-label" style={{ marginTop: 12 }}>Astillero</div>
      <div className="card-grid">
        {shipsConfig.ships.map((d) => {
          const afford = Object.entries(d.cost).every(([r, v]) => (resources[r]?.amount ?? 0) >= v);
          return (
            <div key={d.id} className={`card ${afford ? 'ready' : ''}`}>
              <div className="card-head">
                <span className="card-icon">{d.icon}</span>
                <div>
                  <div className="card-name">{d.name} <span className="muted small">{d.class}</span></div>
                  <div className="card-desc">{d.desc}</div>
                </div>
              </div>
              <div className="card-meta">🪵{d.stats.casco} 💣{d.stats.canones} ⛵{d.stats.velocidad} 📦{d.stats.bodega}</div>
              <button className="btn primary block" disabled={!afford} onClick={() => dispatch({ type: 'BUILD_SHIP', shipId: d.id })}>
                Botar · {cost(d.cost)}
              </button>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}
