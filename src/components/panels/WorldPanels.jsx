// ============================================================
// WORLD PANELS — duel fleet picker + battle report
// ============================================================

import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import { fleetPower } from '../../engines/fleetEngine.js';

// — Duel: pick the fleet to send —
export function DuelPanel() {
  const { state, dispatch } = useGame();
  const conflict = state.conflicts.find((c) => c.id === state.ui.conflictId);
  const [picked, setPicked] = useState([]);
  if (!conflict) return null;
  const idle = state.ships.filter((s) => s.status === 'idle');
  const chosen = idle.filter((s) => picked.includes(s.id));
  const power = fleetPower(chosen);
  const toggle = (id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  return (
    <BottomSheet
      title={`⚔️ Duelo por ${conflict.portName}`}
      subtitle={`${conflict.terrain === 'coast' ? 'Combate costero' : 'Mar abierto'} · guarnición rival ~${conflict.garrison}`}
      onClose={() => dispatch({ type: 'CLOSE_SHEET' })}
      footer={
        <button className="btn primary block" disabled={!picked.length}
          onClick={() => dispatch({ type: 'RESOLVE_CONFLICT', conflictId: conflict.id, shipIds: picked })}>
          Entrar en combate · poder {power} vs {conflict.garrison}
        </button>
      }>
      <p className="small muted">{conflict.terrain === 'coast'
        ? 'En la costa, los bajíos y la maniobra favorecen a las flotas ágiles.'
        : 'En mar abierto manda el poder de fuego bruto.'}</p>
      <div className="section-label">Elige tus barcos</div>
      {idle.length === 0 && <p className="muted small">No tienes barcos disponibles.</p>}
      {idle.map((s) => (
        <div key={s.id} className={`select-row ${picked.includes(s.id) ? 'sel' : ''}`} onClick={() => toggle(s.id)}>
          <span>{picked.includes(s.id) ? '☑️' : '⬜'} {s.icon} {s.name}</span>
          <span className="muted small">❤️{Math.round((s.hpPct ?? 1) * 100)}%</span>
        </div>
      ))}
    </BottomSheet>
  );
}

// — Battle report modal —
export function BattleReport() {
  const { state, dispatch } = useGame();
  const rep = state.lastBattleReport;
  if (!rep) return null;
  return (
    <div className="modal-backdrop" onClick={() => dispatch({ type: 'DISMISS_BATTLE_REPORT' })}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{rep.win ? '🏴‍☠️ ¡Victoria naval!' : '⚓ Derrota'}</h3>
        <p>{rep.report}</p>
        <button className="btn primary block" onClick={() => dispatch({ type: 'DISMISS_BATTLE_REPORT' })}>Continuar</button>
      </div>
    </div>
  );
}
