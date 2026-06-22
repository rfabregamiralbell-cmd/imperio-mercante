import { useGame } from '../../state/GameContext.jsx';

const NAV = [
  { sheet: 'fleet', icon: '🚢', label: 'Flota' },
];

export default function BottomNav() {
  const { state, dispatch } = useGame();
  const active = state.ui.sheet;
  return (
    <nav className="bottom-nav">
      <button className="nav-btn hint" disabled><span className="nav-icon">👆</span><span className="nav-label">Toca puertos y vías</span></button>
      {NAV.map((n) => (
        <button key={n.sheet} className={`nav-btn ${active === n.sheet ? 'active' : ''}`} onClick={() => dispatch({ type: 'OPEN_SHEET', sheet: active === n.sheet ? null : n.sheet })}>
          <span className="nav-icon">{n.icon}</span><span className="nav-label">{n.label}</span>
        </button>
      ))}
    </nav>
  );
}
