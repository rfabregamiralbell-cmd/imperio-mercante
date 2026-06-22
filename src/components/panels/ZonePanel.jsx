// ============================================================
// ZONE PANEL — local market: buy/sell at dynamic prices + contest
// ============================================================

import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import mapConfig from '../../config/map_config.json';
import { priceAt, playerBuyPrice, playerSellPrice, basePrice, MATERIAL_KEYS } from '../../engines/marketEngine.js';

export default function ZonePanel() {
  const { state, dispatch } = useGame();
  const z = state.zones.find((x) => x.id === state.map.selectedZoneId);
  const [qty, setQty] = useState(10);
  if (!z) return null;
  const r = state.resources;
  const mine = z.owner === 'player';
  const rivalColor = z.owner && z.owner !== 'player' ? (mapConfig.rivalColors[z.owner] || '#e05c5c') : null;
  const infl = Math.round((z.influence || 0) * 100);

  // Sort materials: cheapest (good to buy) first
  const rows = MATERIAL_KEYS
    .map((m) => ({ m, price: priceAt(z, m), buy: playerBuyPrice(z, m, z.influence || 0), sell: playerSellPrice(z, m, z.influence || 0), base: basePrice(m), have: Math.floor(r[m]?.amount || 0), stock: Math.floor(z.market?.[m] ?? 0) }))
    .sort((a, b) => a.price / a.base - b.price / b.base);

  return (
    <BottomSheet
      title={`${z.kind === 'barrio' ? '🏘️' : '⛰️'} ${z.name}`}
      subtitle={`${z.cityName || 'Comarca'} · ${mine ? 'tuya' : z.owner ? z.owner : 'libre'} · influencia ${infl}%`}
      onClose={() => dispatch({ type: 'SELECT_ZONE', id: null })}
    >
      <div className="row">
        <span className="muted">Cantidad por operación</span>
        <span className="cargo-ctrl">
          <button className="step" onClick={() => setQty((q) => Math.max(5, q - 5))}>−</button>
          <span>{qty}</span>
          <button className="step" onClick={() => setQty((q) => q + 5)}>＋</button>
        </span>
      </div>

      <div className="section-label">Mercado · oferta y demanda</div>
      <p className="muted small">Verde = barato (compra). Rojo = caro (vende). Comprar sube el precio, vender lo baja.</p>
      {rows.map(({ m, price, buy, sell, base, have, stock }) => {
        const cheap = price < base * 0.9;
        const dear = price > base * 1.1;
        return (
          <div className="cargo-row" key={m} style={{ borderBottom: '1px solid rgba(216,169,58,0.1)' }}>
            <span>
              {r[m].icon} {r[m].label}
              <span className={`small ${cheap ? 'good' : dear ? 'bad' : 'muted'}`} style={{ marginLeft: 6 }}>{price}🪙</span>
              <span className="muted small" style={{ marginLeft: 6 }}>·stock {stock}{have ? ` ·tienes ${have}` : ''}</span>
            </span>
            <span style={{ display: 'flex', gap: 6 }}>
              <button className="btn small" disabled={stock < 1 || r.oro.amount < buy}
                onClick={() => dispatch({ type: 'BUY', zoneId: z.id, material: m, units: qty })}>Comprar {buy}</button>
              <button className="btn small" disabled={have < 1}
                onClick={() => dispatch({ type: 'SELL', zoneId: z.id, material: m, units: qty })}>Vender {sell}</button>
            </span>
          </div>
        );
      })}

      {!mine && z.owner && (
        <>
          <div className="section-label">Control militar</div>
          <p className="small">En manos de <b style={{ color: rivalColor }}>{z.owner}</b>. Tómala por la fuerza para comerciar con ventaja
            {z.kind === 'barrio' ? ' (duelo costero).' : ' (duelo en mar abierto).'}</p>
          <button className="btn danger block" style={{ marginTop: 8 }}
            onClick={() => { dispatch({ type: 'SELECT_ZONE', id: null }); dispatch({ type: 'CONTEST_ZONE', zoneId: z.id }); }}>
            ⚔️ Disputar la zona
          </button>
        </>
      )}
    </BottomSheet>
  );
}
