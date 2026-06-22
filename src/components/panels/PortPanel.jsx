import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import { priceAt, basePrice, MATERIALS, MATERIAL_KEYS } from '../../engines/marketEngine.js';

export default function PortPanel() {
  const { state, dispatch } = useGame();
  const port = state.ports.find((p) => p.id === state.ui.selectedPortId);
  const [qty, setQty] = useState(10);
  if (!port) return null;
  const mine = port.owner === 'player';

  const rows = MATERIAL_KEYS.map((m) => ({
    m, price: priceAt(port, m), base: basePrice(m),
    have: Math.floor(state.warehouse[m] || 0), stock: Math.floor(port.market[m] ?? 0),
  })).sort((a, b) => a.price / a.base - b.price / b.base);

  return (
    <BottomSheet
      title={`⚓ ${port.name}`}
      subtitle={mine ? 'Tu puerto base' : port.owner ? `Controlado por ${port.owner}` : 'Puerto libre'}
      onClose={() => dispatch({ type: 'SELECT_PORT', id: null })}
    >
      <div className="row">
        <span className="muted">Cantidad por operación</span>
        <span className="stepper">
          <button onClick={() => setQty((q) => Math.max(5, q - 5))}>−</button>
          <span>{qty}</span>
          <button onClick={() => setQty((q) => q + 5)}>＋</button>
        </span>
      </div>
      <div className="section-label">Mercado · oferta y demanda</div>
      <p className="muted small">Verde = barato (compra). Rojo = caro (vende).</p>
      {rows.map(({ m, price, base, have, stock }) => {
        const cheap = price < base * 0.9, dear = price > base * 1.1;
        return (
          <div className="market-row" key={m}>
            <span className="mr-name">{MATERIALS[m].icon} {MATERIALS[m].label}
              <span className={`mr-price ${cheap ? 'good' : dear ? 'bad' : 'muted'}`}>{price}🪙</span>
              <span className="muted small"> ·{stock}{have ? ` ·tú ${have}` : ''}</span>
            </span>
            <span className="mr-actions">
              <button className="btn small" disabled={stock < 1 || state.oro < price} onClick={() => dispatch({ type: 'BUY', portId: port.id, material: m, units: qty })}>Compra</button>
              <button className="btn small" disabled={have < 1} onClick={() => dispatch({ type: 'SELL', portId: port.id, material: m, units: qty })}>Vende</button>
            </span>
          </div>
        );
      })}
    </BottomSheet>
  );
}
