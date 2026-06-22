// ============================================================
// WORLD PANELS — zone detail, duel fleet picker, battle report
// ============================================================

import { useState } from 'react';
import { useGame } from '../../state/GameContext.jsx';
import BottomSheet from '../ui/BottomSheet.jsx';
import mapConfig from '../../config/map_config.json';
import { expansionCost, zoneYield } from '../../engines/influenceEngine.js';
import { fleetPower, garrisonPower } from '../../engines/fleetEngine.js';

// — Zone detail: shown when a pin is tapped —
export function ZonePanel() {
  const { state, dispatch } = useGame();
  const z = state.zones.find((x) => x.id === state.map.selectedZoneId);
  if (!z) return null;
  const r = state.resources;
  const cost = expansionCost(z);
  const mine = z.owner === 'player';
  const rivalColor = z.owner && z.owner !== 'player' ? (mapConfig.rivalColors[z.owner] || '#e05c5c') : null;

  return (
    <BottomSheet title={`${z.kind === 'barrio' ? '🏘️' : '⛰️'} ${z.name}`} subtitle={z.cityName || 'Comarca independiente'} onClose={() => dispatch({ type: 'SELECT_ZONE', id: null })}>
      <div className="row"><span className="muted">Material</span><span>{r[z.material]?.icon} {r[z.material]?.label} ({zoneYield(z)}/ciclo)</span></div>
      <div className="row"><span className="muted">Liga / dificultad</span><span>Tier {z.tier}</span></div>
      <div className="row"><span className="muted">Control</span>
        <span style={{ color: mine ? 'var(--player)' : rivalColor || 'var(--good)' }}>
          {mine ? 'Tuyo' : z.owner ? z.owner : 'Libre'}
        </span>
      </div>

      {mine && <p className="good small" style={{ marginTop: 10 }}>Esta zona ya extrae materiales para tu imperio.</p>}

      {!mine && !z.owner && (
        <button className="btn primary block" style={{ marginTop: 12 }}
          disabled={r.influencia.amount < cost.influencia || r.oro.amount < cost.oro}
          onClick={() => { dispatch({ type: 'EXPAND_ZONE', zoneId: z.id }); dispatch({ type: 'SELECT_ZONE', id: null }); }}>
          Reclamar · <span className={r.influencia.amount >= cost.influencia ? '' : 'cant'}>🚩{cost.influencia}</span>
          <span className={r.oro.amount >= cost.oro ? '' : 'cant'}>🪙{cost.oro}</span>
        </button>
      )}

      {!mine && z.owner && (
        <>
          <p className="small" style={{ marginTop: 10 }}>
            En manos de <b style={{ color: rivalColor }}>{z.owner}</b>. Para tomarla debes vencer su guarnición en un duelo de flotas
            {z.kind === 'barrio' ? ' costero (la forma del litoral te favorece si eres ágil).' : ' en mar abierto (gana la flota más poderosa).'}
          </p>
          <button className="btn danger block" style={{ marginTop: 12 }}
            onClick={() => { dispatch({ type: 'SELECT_ZONE', id: null }); dispatch({ type: 'CONTEST_ZONE', zoneId: z.id }); }}>
            ⚔️ Disputar la zona
          </button>
        </>
      )}
    </BottomSheet>
  );
}

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
      title={`⚔️ Duelo por ${conflict.zoneName}`}
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
