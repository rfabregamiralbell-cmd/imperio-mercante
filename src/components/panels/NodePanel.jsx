// ============================================================
// VÍA PANEL — al tocar una vía: recurso que transporta, control,
// trabajar la vía, y botón al mercado del puerto.
// ============================================================

import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';

export default function NodePanel() {
  const { state, dispatch } = useGame();
  const n = state.nodes.find((x) => x.id === state.map.selectedNodeId);
  if (!n) return null;
  const port = state.ports.find((p) => p.id === n.portId);
  const mat = state.resources[n.material];
  const control = Math.round((n.control || 0) * 100);
  const owned = n.owner === 'player' && (n.control || 0) >= 0.5;
  const portMine = port?.owner === 'player';
  const cost = 40 + n.upkeep * 6;

  return (
    <BottomSheet
      title={`🚉 Vía de ${n.name}`}
      subtitle={`Transporta ${mat?.icon} ${mat?.label} → ${port?.name}`}
      onClose={() => dispatch({ type: 'SELECT_NODE', id: null })}
      footer={
        <button className="btn block" onClick={() => dispatch({ type: 'SELECT_PORT', id: port.id })}>
          ⚓ Ir al mercado de {port?.name}
        </button>
      }
    >
      <div className="row"><span className="muted">Recurso transportado</span><span>{mat?.icon} {mat?.label}</span></div>
      <div className="row"><span className="muted">Puerto de salida</span><span>{port?.name} {portMine ? '(tuyo)' : port?.owner ? `(${port.owner})` : '(libre)'}</span></div>
      <div className="row"><span className="muted">Control de la vía</span><span className={owned ? 'good' : 'warn'}>{control}%</span></div>
      <div className="bar"><div className={`bar-fill ${owned ? 'good' : ''}`} style={{ width: `${control}%` }} /></div>
      <div className="row"><span className="muted">Mantenimiento</span><span>{n.upkeep}🪙/ciclo</span></div>

      {!portMine && (
        <p className="bad small" style={{ marginTop: 10 }}>Debes controlar el puerto de {port?.name} antes de trabajar esta vía. Conquístalo desde su mercado.</p>
      )}
      {portMine && (
        <>
          <p className="muted small" style={{ marginTop: 10 }}>
            Invierte para reforzar la vía. Al 50% la posees: se ilumina con tu color y su {mat?.label} fluye a {port?.name} cada ciclo
            (mientras pagues el mantenimiento).
          </p>
          <button className="btn primary block" style={{ marginTop: 10 }}
            disabled={state.resources.oro.amount < cost || control >= 100}
            onClick={() => dispatch({ type: 'WORK_VIA', nodeId: n.id })}>
            {control >= 100 ? 'Vía consolidada' : `Trabajar la vía · ${cost}🪙 (+25%)`}
          </button>
        </>
      )}
    </BottomSheet>
  );
}
