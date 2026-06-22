// ============================================================
// TRADE PANEL — sell extracted materials for oro (+ influence)
// ============================================================

import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import { materialPrice } from '../../engines/influenceEngine.js';

const RAW = ['oro', 'influencia', 'madera', 'hierro'];

export default function TradePanel() {
  const { state, dispatch } = useGame();
  const r = state.resources;
  const goods = Object.keys(r).filter((k) => !RAW.includes(k));
  const totalValue = goods.reduce((sum, k) => sum + Math.floor(r[k].amount) * materialPrice(k), 0);

  return (
    <BottomSheet
      title="⚖️ Comercio"
      subtitle="Vende lo que extraes. El comercio sube tu influencia."
      onClose={() => dispatch({ type: 'CLOSE_SHEET' })}
      footer={
        <button className="btn primary block" disabled={totalValue <= 0}
          onClick={() => dispatch({ type: 'TRADE_ALL' })}>
          Vender todo · +{totalValue}🪙
        </button>
      }>
      <div className="section-label">Mercancías en almacén</div>
      {goods.every((k) => r[k].amount < 1) && <p className="muted small">No tienes mercancías. Controla más zonas para extraer materiales.</p>}
      {goods.filter((k) => r[k].amount >= 1).map((k) => {
        const amt = Math.floor(r[k].amount);
        const value = amt * materialPrice(k);
        return (
          <div className="cargo-row" key={k}>
            <span>{r[k].icon} {r[k].label} <span className="muted">×{amt}</span></span>
            <span>
              <span className="muted small" style={{ marginRight: 8 }}>{value}🪙</span>
              <button className="btn small" onClick={() => dispatch({ type: 'TRADE_MATERIAL', material: k, units: amt })}>Vender</button>
            </span>
          </div>
        );
      })}
      <p className="muted small" style={{ marginTop: 12 }}>Precio por unidad varía según el material. La plata, la seda y las especias son las más valiosas.</p>
    </BottomSheet>
  );
}
