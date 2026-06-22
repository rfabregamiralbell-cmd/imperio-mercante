// ============================================================
// SEGMENT PANEL — al tocar un tramo de vía: recurso que transporta,
// control, trabajar la vía, y botón al mercado del puerto.
// ============================================================

import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';

export default function SegmentPanel() {
  const { state, dispatch } = useGame();
  const seg = state.segments.find((x) => x.id === state.map.selectedSegmentId);
  if (!seg) return null;
  const port = state.ports.find((p) => p.id === seg.portId);
  const mat = seg.material ? state.resources[seg.material] : null;
  const cityA = state.cities.find((c) => c.id === seg.a);
  const cityB = state.cities.find((c) => c.id === seg.b);
  const control = Math.round((seg.control || 0) * 100);
  const owned = seg.owner === 'player' && (seg.control || 0) >= 0.5;
  const portMine = port?.owner === 'player';
  const cost = 40 + seg.upkeep * 6;

  return (
    <BottomSheet
      title={`🚉 ${cityA?.name} — ${cityB?.name}`}
      subtitle={mat ? `Transporta ${mat.icon} ${mat.label}` : 'Tramo de enlace'}
      onClose={() => dispatch({ type: 'SELECT_SEGMENT', id: null })}
      footer={port && (
        <button className="btn block" onClick={() => dispatch({ type: 'SELECT_PORT', id: port.id })}>
          ⚓ Ir al mercado de {port.name}
        </button>
      )}
    >
      {mat && <div className="row"><span className="muted">Recurso</span><span>{mat.icon} {mat.label}</span></div>}
      <div className="row"><span className="muted">Puerto de salida</span><span>{port?.name} {portMine ? '(tuyo)' : port?.owner ? `(${port.owner})` : '(libre)'}</span></div>
      <div className="row"><span className="muted">Control del tramo</span><span className={owned ? 'good' : 'warn'}>{control}%</span></div>
      <div className="bar"><div className={`bar-fill ${owned ? 'good' : ''}`} style={{ width: `${control}%` }} /></div>
      <div className="row"><span className="muted">Mantenimiento</span><span>{seg.upkeep}🪙/ciclo</span></div>

      {!portMine && (
        <p className="bad small" style={{ marginTop: 10 }}>Controla el puerto de {port?.name} antes de trabajar esta vía.</p>
      )}
      {portMine && (
        <>
          <p className="muted small" style={{ marginTop: 10 }}>
            Invierte para reforzar el tramo. Al 50% lo controlas: se ilumina con tu color{mat ? ` y su ${mat.label} fluye a ${port?.name} cada ciclo` : ''} (mientras pagues el mantenimiento).
          </p>
          <button className="btn primary block" style={{ marginTop: 10 }}
            disabled={state.resources.oro.amount < cost || control >= 100}
            onClick={() => dispatch({ type: 'WORK_VIA', segmentId: seg.id })}>
            {control >= 100 ? 'Tramo consolidado' : `Trabajar la vía · ${cost}🪙 (+25%)`}
          </button>
        </>
      )}
    </BottomSheet>
  );
}
