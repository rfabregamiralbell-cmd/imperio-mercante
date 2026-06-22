// ============================================================
// GAME REDUCER — Imperio Mercante
// Pillars: Influencia (paint zones) · Comercio (materials→oro) · Militar (fleet)
// ============================================================

import shipsConfig from '../config/ships_config.json';
import mapConfig from '../config/map_config.json';
import { createInitialState } from './initialState.js';
import {
  zoneYield, materialPrice, materialsPerCycle, influencePerCycle, expansionCost,
} from '../engines/influenceEngine.js';
import {
  effectiveStats, fleetPower, resolveDuel, garrisonPower,
} from '../engines/fleetEngine.js';

const getShipDef = (id) => shipsConfig.ships.find((s) => s.id === id);
const getUpgrade = (id) => shipsConfig.upgrades.find((u) => u.id === id);
const SHIP_NAMES = ['Intrépido', 'Soberbia', 'San Rafael', 'Fortuna', 'Audaz', 'Centinela', 'Tempestad', 'Esperanza', 'Relámpago', 'Constancia', 'Vencedor', 'Galán'];

function notify(s, type, message, duration = 3800) {
  s.notifications = [...s.notifications, { id: Date.now() + Math.random(), type, message, duration }];
}
function has(resources, cost) {
  return Object.entries(cost || {}).every(([r, v]) => (resources[r]?.amount ?? 0) >= v);
}
function spend(s, cost) {
  const r = { ...s.resources };
  Object.entries(cost).forEach(([k, v]) => { r[k] = { ...r[k], amount: r[k].amount - v }; });
  s.resources = r;
}
function gain(s, key, amount) {
  const r = { ...s.resources };
  r[key] = { ...r[key], amount: (r[key]?.amount ?? 0) + amount };
  s.resources = r;
}

export function gameReducer(state, action) {
  const s = { ...state };

  switch (action.type) {
    // ── Economy cycle ────────────────────────────────────────
    case 'TICK': {
      const now = action.now;
      s.tick += 1;
      if (!s._lastCycleAt) s._lastCycleAt = 0;
      if (now - s._lastCycleAt >= 4000) {
        s._lastCycleAt = now;
        // Materials from owned zones
        const mats = materialsPerCycle(s.zones);
        const r = { ...s.resources };
        Object.entries(mats).forEach(([m, v]) => { if (r[m]) r[m] = { ...r[m], amount: r[m].amount + v }; });
        // Influence accrues
        const infl = influencePerCycle(s.zones);
        if (r.influencia) r.influencia = { ...r.influencia, amount: r.influencia.amount + infl };
        s.resources = r;
      }
      // expire notifications
      s.notifications = s.notifications.filter((n) => {
        if (!n._shownAt) n._shownAt = now;
        return now - n._shownAt < (n.duration || 3800);
      });
      return s;
    }

    // ── Sell a material for oro ──────────────────────────────
    case 'TRADE_MATERIAL': {
      const { material, units } = action;
      const have = s.resources[material]?.amount ?? 0;
      const qty = Math.min(units, have);
      if (qty <= 0) { notify(s, 'warning', 'No tienes esa mercancía para vender.'); return s; }
      const gold = Math.round(qty * materialPrice(material));
      spend(s, { [material]: qty });
      gain(s, 'oro', gold);
      gain(s, 'influencia', Math.max(1, Math.round(gold / 40))); // trade lifts base influence
      notify(s, 'success', `Vendiste ${qty} ${s.resources[material].label} por ${gold} oro.`);
      return s;
    }

    case 'TRADE_ALL': {
      // Sell every tradeable material at once.
      let gold = 0, influence = 0;
      const r = { ...s.resources };
      Object.keys(r).forEach((k) => {
        if (['oro', 'influencia', 'madera', 'hierro'].includes(k)) return;
        const amt = Math.floor(r[k].amount);
        if (amt > 0) { gold += Math.round(amt * materialPrice(k)); r[k] = { ...r[k], amount: r[k].amount - amt }; }
      });
      if (gold <= 0) { notify(s, 'warning', 'No hay mercancías que vender.'); return s; }
      influence = Math.max(1, Math.round(gold / 40));
      r.oro = { ...r.oro, amount: r.oro.amount + gold };
      r.influencia = { ...r.influencia, amount: r.influencia.amount + influence };
      s.resources = r;
      notify(s, 'success', `Comercio cerrado: +${gold} oro, +${influence} influencia.`);
      return s;
    }

    // ── Expand into a FREE zone (no rival) ───────────────────
    case 'EXPAND_ZONE': {
      const zone = s.zones.find((z) => z.id === action.zoneId);
      if (!zone) return s;
      if (zone.owner === 'player') { notify(s, 'info', 'Ya controlas esta zona.'); return s; }
      if (zone.owner) { notify(s, 'warning', 'Zona en manos rivales: debes disputarla con tu flota.'); return s; }
      const cost = expansionCost(zone);
      if (!has(s.resources, cost)) { notify(s, 'warning', `Necesitas ${cost.influencia}🚩 y ${cost.oro}🪙.`); return s; }
      spend(s, cost);
      s.zones = s.zones.map((z) => z.id === zone.id ? { ...z, owner: 'player' } : z);
      notify(s, 'success', `${zone.name} ahora produce ${s.resources[zone.material].label} para tu imperio.`);
      return s;
    }

    // ── Contest a RIVAL zone → opens a conflict (pick fleet) ──
    case 'CONTEST_ZONE': {
      const zone = s.zones.find((z) => z.id === action.zoneId);
      if (!zone || !zone.owner || zone.owner === 'player') return s;
      const idleShips = s.ships.filter((sh) => sh.status === 'idle');
      if (idleShips.length === 0) { notify(s, 'warning', 'No tienes barcos disponibles para el duelo. Construye una flota.'); return s; }
      const conflict = {
        id: `cf_${Date.now()}`,
        zoneId: zone.id,
        zoneName: zone.name,
        rival: zone.owner,
        terrain: zone.kind === 'barrio' ? 'coast' : 'open_sea',
        garrison: garrisonPower(zone, Math.random),
      };
      s.conflicts = [...s.conflicts, conflict];
      s.ui = { ...s.ui, conflictId: conflict.id, openSheet: 'duel' };
      return s;
    }

    // ── Resolve a conflict: auto naval duel + battle report ──
    case 'RESOLVE_CONFLICT': {
      const conflict = s.conflicts.find((c) => c.id === action.conflictId);
      if (!conflict) return s;
      const fleet = s.ships.filter((sh) => action.shipIds.includes(sh.id) && sh.status === 'idle');
      if (!fleet.length) { notify(s, 'warning', 'Asigna al menos un barco al duelo.'); return s; }

      const result = resolveDuel(fleet, conflict.garrison, conflict.terrain, Math.random);

      // Apply damage to participating ships; sink "losses"
      const fleetIds = fleet.map((f) => f.id);
      let sunk = 0;
      s.ships = s.ships
        .map((sh) => {
          if (!fleetIds.includes(sh.id)) return sh;
          const newHp = Math.max(0, (sh.hpPct ?? 1) - result.damagePct);
          return { ...sh, hpPct: newHp, status: newHp <= 0.1 ? 'sunk' : 'idle' };
        })
        .filter((sh) => {
          if (sh.status === 'sunk' && sunk < result.losses) { sunk++; return false; }
          return true;
        });

      if (result.win) {
        s.zones = s.zones.map((z) => z.id === conflict.zoneId ? { ...z, owner: 'player' } : z);
      }
      s.conflicts = s.conflicts.filter((c) => c.id !== conflict.id);
      s.ui = { ...s.ui, conflictId: null, openSheet: null };

      const report = `${result.win ? '🏴‍☠️ ¡Victoria!' : '⚓ Derrota'} en ${conflict.zoneName} (${conflict.terrain === 'coast' ? 'combate costero' : 'mar abierto'}). `
        + `Tu poder ${result.playerPower} vs ${result.enemyPower}. ${result.message}`
        + (sunk > 0 ? ` Perdiste ${sunk} barco(s).` : '');
      s.lastBattleReport = { ...result, report, zoneName: conflict.zoneName };
      notify(s, result.win ? 'success' : 'warning', report, 6000);
      return s;
    }

    case 'DISMISS_BATTLE_REPORT': {
      s.lastBattleReport = null;
      return s;
    }

    // ── Build a ship ─────────────────────────────────────────
    case 'BUILD_SHIP': {
      const def = getShipDef(action.shipId);
      if (!def) return s;
      if (!has(s.resources, def.cost)) { notify(s, 'warning', 'Recursos insuficientes para el barco.'); return s; }
      spend(s, def.cost);
      const name = SHIP_NAMES[s.shipCounter % SHIP_NAMES.length];
      const ship = {
        id: `ship_${++s.shipCounter}`,
        configId: def.id,
        name,
        class: def.class,
        icon: def.icon,
        hpPct: 1,
        upgrades: {},
        status: 'idle',
      };
      s.ships = [...s.ships, ship];
      notify(s, 'success', `🚢 Botado el ${def.name} «${name}».`);
      return s;
    }

    // ── Upgrade a ship (hiperrealista: casco/cañones/velamen/bodega) ──
    case 'UPGRADE_SHIP': {
      const ship = s.ships.find((x) => x.id === action.shipId);
      const up = getUpgrade(action.upgradeId);
      if (!ship || !up) return s;
      const level = ship.upgrades?.[up.id] || 0;
      if (level >= up.max) { notify(s, 'info', `${up.name} ya al máximo.`); return s; }
      const cost = {}; Object.entries(up.costPerLevel).forEach(([r, v]) => { cost[r] = v * (level + 1); });
      if (!has(s.resources, cost)) { notify(s, 'warning', 'Recursos insuficientes para la mejora.'); return s; }
      spend(s, cost);
      s.ships = s.ships.map((x) => x.id === ship.id
        ? { ...x, upgrades: { ...x.upgrades, [up.id]: level + 1 } } : x);
      notify(s, 'success', `${up.icon} ${ship.name}: ${up.name} a nivel ${level + 1}.`);
      return s;
    }

    // ── Repair a ship ────────────────────────────────────────
    case 'REPAIR_SHIP': {
      const ship = s.ships.find((x) => x.id === action.shipId);
      if (!ship || (ship.hpPct ?? 1) >= 1) return s;
      const cost = { oro: 60, madera: 30 };
      if (!has(s.resources, cost)) { notify(s, 'warning', 'Recursos insuficientes para reparar.'); return s; }
      spend(s, cost);
      s.ships = s.ships.map((x) => x.id === ship.id ? { ...x, hpPct: 1 } : x);
      notify(s, 'success', `🔧 ${ship.name} reparado.`);
      return s;
    }

    // ── UI ───────────────────────────────────────────────────
    case 'OPEN_SHEET':      s.ui = { ...s.ui, openSheet: action.sheet }; return s;
    case 'CLOSE_SHEET':     s.ui = { ...s.ui, openSheet: null, conflictId: null }; return s;
    case 'SELECT_ZONE':     s.ui = { ...s.ui, openSheet: action.id ? 'zone' : s.ui.openSheet }; s.map = { ...s.map, selectedZoneId: action.id }; return s;
    case 'SET_MAP_VIEW':    s.map = { ...s.map, view: action.view }; return s;
    case 'DISMISS_NOTIFICATION': s.notifications = s.notifications.filter((n) => n.id !== action.id); return s;

    case 'LOAD_STATE': {
      const fresh = createInitialState();
      return { ...fresh, ...action.state, ui: { ...fresh.ui, ...action.state.ui }, map: { ...fresh.map, ...action.state.map } };
    }

    default:
      return state;
  }
}
