import { useGame } from '../../state/GameContext.jsx';

const NAV = [
  { sheet: 'world',  icon: '🌍', label: 'Mundo' },
  { sheet: 'routes', icon: '🧭', label: 'Rutas' },
  { sheet: 'fleet',  icon: '🚢', label: 'Flota' },
  { sheet: 'bank',   icon: '🏦', label: 'Banca' },
];

export default function BottomNav() {
  const { state, dispatch } = useGame();
  const active = state.ui.openSheet;
  return (
    <nav className="bottom-nav">
      {NAV.map((n) => (
        <button key={n.sheet} className={`nav-btn ${active === n.sheet ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'OPEN_SHEET', sheet: active === n.sheet ? null : n.sheet })}>
          <span className="nav-icon">{n.icon}</span>
          <span className="nav-label">{n.label}</span>
        </button>
      ))}
    </nav>
  );
}
