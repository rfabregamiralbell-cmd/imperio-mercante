import { useGame } from '../../state/GameContext.jsx';
import { MATERIALS } from '../../engines/marketEngine.js';

export default function TopHUD() {
  const { state } = useGame();
  const goods = Object.entries(state.warehouse).filter(([, v]) => v > 0);
  return (
    <div className="hud">
      <span className="hud-res gold"><span className="ic">🪙</span><span className="val">{Math.floor(state.oro)}</span></span>
      {goods.length === 0 && <span className="hud-res muted small">Sin mercancías — tus vías están produciendo…</span>}
      {goods.map(([m, v]) => (
        <span key={m} className="hud-res"><span className="ic">{MATERIALS[m].icon}</span><span className="val">{Math.floor(v)}</span></span>
      ))}
    </div>
  );
}
