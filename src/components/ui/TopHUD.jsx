import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';

const PRIMARY = ['oro', 'influencia', 'madera', 'hierro'];

export default function TopHUD() {
  const { state } = useGame();
  const [open, setOpen] = useState(false);
  const r = state.resources;
  const goods = Object.keys(r).filter((k) => !PRIMARY.includes(k) && r[k].amount > 0);
  const shown = open ? [...PRIMARY, ...goods] : PRIMARY;

  return (
    <div className="hud">
      {shown.map((k, i) => (
        <span key={k} className={`hud-res ${k === 'oro' ? 'gold' : ''} ${k === 'influencia' ? 'infl' : ''}`}>
          <span className="ic">{r[k].icon}</span>
          <span className="val">{Math.floor(r[k].amount)}</span>
          {i === PRIMARY.length - 1 && open ? null : null}
        </span>
      ))}
      <button className="hud-more" onClick={() => setOpen((o) => !o)} aria-label="Más recursos">{open ? '−' : '+'}</button>
    </div>
  );
}
