// ============================================================
// NODE PANEL — interior production node: work the vía to own it
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
      title={`🚉 ${n.name}`}
      subtitle={`Vía interior → ${port?.name} · produce ${mat?.icon} ${mat?.label}`}
      onClose={() => dispatch({ type: 'SELECT_NODE', id: null })}
    >
      <div className="row"><span className="muted">Material</span><span>{mat?.icon} {mat?.label}</span></div>
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
            Invierte para reforzar la vía. Al llegar al 50% la posees y su producción fluye a {port?.name} cada ciclo
            (mientras puedas pagar el mantenimiento).
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
