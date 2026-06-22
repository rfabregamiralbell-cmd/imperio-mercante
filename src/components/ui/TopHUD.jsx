import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';

const PRIMARY = ['oro', 'madera', 'hierro'];

export default function TopHUD() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const r = state.resources;
  const goods = Object.keys(r).filter((k) => !PRIMARY.includes(k) && r[k].amount > 0);
  const shown = open ? [...PRIMARY, ...goods] : PRIMARY;
  const debt = (state.loans || []).reduce((s, l) => s + l.due, 0);

  return (
    <div className="hud">
      {shown.map((k) => (
        <span key={k} className={`hud-res ${k === 'oro' ? 'gold' : ''}`}>
          <span className="ic">{r[k].icon}</span>
          <span className="val">{Math.floor(r[k].amount)}</span>
        </span>
      ))}
      {debt > 0 && <span className="hud-res" style={{ color: 'var(--bad)' }}><span className="ic">🏦</span><span className="val">-{debt}</span></span>}
      <button className="hud-more" onClick={() => setOpen((o) => !o)} aria-label="Más recursos">{open ? '−' : '+'}</button>
    </div>
  );
}
