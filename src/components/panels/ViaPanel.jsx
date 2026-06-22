import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import { MATERIALS } from '../../engines/marketEngine.js';

export default function ViaPanel() {
  const { state, dispatch } = useGame();
  const via = state.vias.find((v) => v.id === state.ui.selectedViaId);
  if (!via) return null;
  const port = state.ports.find((p) => p.id === via.port);
  const mat = MATERIALS[via.material];
  const mine = via.owner === 'player';

  return (
    <BottomSheet
      title={`🚉 ${via.name}`}
      subtitle={`Extrae ${mat.icon} ${mat.label} → ${port?.name}`}
      onClose={() => dispatch({ type: 'SELECT_VIA', id: null })}
      footer={port && <button className="btn block" onClick={() => dispatch({ type: 'SELECT_PORT', id: port.id })}>⚓ Ir al mercado de {port.name}</button>}
    >
      <div className="row"><span className="muted">Recurso</span><span>{mat.icon} {mat.label}</span></div>
      <div className="row"><span className="muted">Puerto de destino</span><span>{port?.name}</span></div>
      <div className="row"><span className="muted">Producción</span><span>{via.rate}/ciclo</span></div>
      <div className="row"><span className="muted">Estado</span><span className={mine ? 'good' : 'muted'}>{mine ? 'Tuya — produciendo' : 'No controlada'}</span></div>
      {mine && <p className="muted small" style={{ marginTop: 10 }}>Esta vía extrae {mat.label} automáticamente y lo lleva a tu almacén. Véndelo donde escasee para sacar beneficio.</p>}
    </BottomSheet>
  );
}
