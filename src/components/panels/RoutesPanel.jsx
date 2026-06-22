// ============================================================
// ROUTES PANEL — maritime routes between ports
// ============================================================

import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';

export default function RoutesPanel() {
  const { state, dispatch } = useGame();
  const [creating, setCreating] = useState(false);
  const [stops, setStops] = useState([]);
  const [shipIds, setShipIds] = useState([]);
  const [auto, setAuto] = useState(true);

  const portName = (id) => state.ports.find((p) => p.id === id)?.name || id;
  const idleShips = state.ships.filter((s) => s.status === 'idle');
  const toggleStop = (id) => setStops((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleShip = (id) => setShipIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const create = () => {
    dispatch({ type: 'CREATE_SEA_ROUTE', stops, shipIds, auto, now: Date.now() });
    setCreating(false); setStops([]); setShipIds([]); setAuto(true);
  };

  if (creating) {
    return (
      <BottomSheet title="🧭 Nueva ruta marítima" subtitle="Elige puertos (en orden) y barcos" onClose={() => setCreating(false)}
        footer={<button className="btn primary block" disabled={stops.length < 2 || shipIds.length === 0} onClick={create}>Crear ruta ({stops.length} puertos, {shipIds.length} barcos)</button>}>
        <div className="section-label">Puertos del circuito</div>
        <p className="muted small">El barco compra barato y vende caro en cada puerto del circuito.</p>
        {state.ports.map((p) => {
          const order = stops.indexOf(p.id);
          return (
            <div key={p.id} className={`select-row ${order >= 0 ? 'sel' : ''}`} onClick={() => toggleStop(p.id)}>
              <span>{order >= 0 ? `${order + 1}️⃣` : '⬜'} ⚓ {p.name} <span className="muted small">{p.country}</span></span>
            </div>
          );
        })}
        <div className="section-label">Barcos {idleShips.length === 0 ? '(ninguno libre)' : ''}</div>
        {idleShips.map((s) => (
          <div key={s.id} className={`select-row ${shipIds.includes(s.id) ? 'sel' : ''}`} onClick={() => toggleShip(s.id)}>
            <span>{shipIds.includes(s.id) ? '☑️' : '⬜'} {s.icon} {s.name}</span>
          </div>
        ))}
        <div className="row" style={{ marginTop: 8 }}>
          <span>🤖 Comercio automático</span>
          <button className={`btn small ${auto ? 'primary' : ''}`} onClick={() => setAuto((a) => !a)}>{auto ? 'Sí' : 'No'}</button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet title="🧭 Rutas marítimas" subtitle={`${state.seaRoutes.length} ruta(s) activa(s)`} onClose={() => dispatch({ type: 'CLOSE_SHEET' })}
      footer={<button className="btn primary block" disabled={idleShips.length === 0} onClick={() => setCreating(true)}>＋ Nueva ruta {idleShips.length === 0 ? '(necesitas un barco libre)' : ''}</button>}>
      {state.seaRoutes.length === 0 && <p className="muted small">Sin rutas. Crea un circuito entre puertos para comerciar en automático.</p>}
      {state.seaRoutes.map((rt) => (
        <div key={rt.id} className="card" style={{ marginBottom: 8 }}>
          <div className="card-head">
            <span className="card-icon">🧭</span>
            <div>
              <div className="card-name">{rt.name}</div>
              <div className="card-desc">{rt.stops.map(portName).join(' → ')}</div>
            </div>
          </div>
          <div className="card-meta">{rt.shipIds.length} barco(s) · {rt.auto ? '🤖 automático' : '✋ manual'}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn small" onClick={() => dispatch({ type: 'TOGGLE_ROUTE_AUTO', routeId: rt.id })}>{rt.auto ? 'Pausar' : 'Activar'}</button>
            <button className="btn small danger" onClick={() => dispatch({ type: 'DELETE_ROUTE', routeId: rt.id })}>Disolver</button>
          </div>
        </div>
      ))}
    </BottomSheet>
  );
}
