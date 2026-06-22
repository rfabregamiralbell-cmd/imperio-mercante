// ============================================================
// PORT PANEL — port market (buy/sell) + contest if rival
// ============================================================

import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import mapConfig from '../../config/map_config.json';
import { priceAt, playerBuyPrice, playerSellPrice, basePrice, MATERIAL_KEYS } from '../../engines/marketEngine.js';

export default function PortPanel() {
  const { state, dispatch } = useGame();
  const p = state.ports.find((x) => x.id === state.map.selectedPortId);
  const [qty, setQty] = useState(10);
  if (!p) return null;
  const r = state.resources;
  const mine = p.owner === 'player';
  const rivalColor = p.owner && p.owner !== 'player' ? (mapConfig.rivalColors[p.owner] || '#e05c5c') : null;
  const segs = state.segments.filter((n) => n.portId === p.id && n.material);

  const rows = MATERIAL_KEYS
    .map((m) => ({ m, price: priceAt(p, m), buy: playerBuyPrice(p, m, p.influence || 0), sell: playerSellPrice(p, m, p.influence || 0), base: basePrice(m), have: Math.floor(r[m]?.amount || 0), stock: Math.floor(p.market?.[m] ?? 0) }))
    .sort((a, b) => a.price / a.base - b.price / b.base);

  return (
    <BottomSheet
      title={`⚓ ${p.name}`}
      subtitle={`${p.country} · ${mine ? 'tu puerto' : p.owner ? p.owner : 'libre'} · influencia ${Math.round((p.influence || 0) * 100)}%`}
      onClose={() => dispatch({ type: 'SELECT_PORT', id: null })}
    >
      {segs.length > 0 && (
        <p className="muted small">🚉 {segs.length} vía(s) traen recursos a este puerto: {segs.map((n) => state.resources[n.material]?.icon).join(' ')}. Tócalas en el mapa para trabajarlas.</p>
      )}

      <div className="row">
        <span className="muted">Cantidad por operación</span>
        <span className="cargo-ctrl">
          <button className="step" onClick={() => setQty((q) => Math.max(5, q - 5))}>−</button>
          <span>{qty}</span>
          <button className="step" onClick={() => setQty((q) => q + 5)}>＋</button>
        </span>
      </div>

      <div className="section-label">Mercado · oferta y demanda</div>
      <p className="muted small">Verde = barato (compra). Rojo = caro (vende).</p>
      {rows.map(({ m, price, buy, sell, base, have, stock }) => {
        const cheap = price < base * 0.9, dear = price > base * 1.1;
        return (
          <div className="cargo-row" key={m} style={{ borderBottom: '1px solid rgba(216,169,58,0.1)' }}>
            <span>{r[m].icon} {r[m].label}
              <span className={`small ${cheap ? 'good' : dear ? 'bad' : 'muted'}`} style={{ marginLeft: 6 }}>{price}🪙</span>
              <span className="muted small" style={{ marginLeft: 6 }}>·{stock}{have ? ` ·tú ${have}` : ''}</span>
            </span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button className="btn small" disabled={stock < 1 || r.oro.amount < buy} onClick={() => dispatch({ type: 'BUY', portId: p.id, material: m, units: qty })}>Compra {buy}</button>
              <button className="btn small" disabled={have < 1} onClick={() => dispatch({ type: 'SELL', portId: p.id, material: m, units: qty })}>Vende {sell}</button>
            </span>
          </div>
        );
      })}

      {!mine && p.owner && (
        <>
          <div className="section-label">Control militar</div>
          <p className="small">Puerto de <b style={{ color: rivalColor }}>{p.owner}</b>. Conquístalo para comerciar con ventaja y abrir sus vías.</p>
          <button className="btn danger block" style={{ marginTop: 8 }}
            onClick={() => { dispatch({ type: 'SELECT_PORT', id: null }); dispatch({ type: 'CONTEST_PORT', portId: p.id }); }}>
            ⚔️ Atacar el puerto
          </button>
        </>
      )}
    </BottomSheet>
  );
}
