// ============================================================
// GAME REDUCER — Imperio Mercante (logística dos capas)
// TIERRA: vías interior→puerto (control + mantenimiento) alimentan el puerto.
// MAR: rutas entre puertos + comercio en mercados dinámicos + militar.
// ============================================================

import shipsConfig from '../config/ships_config.json';
import { createInitialState } from './initialState.js';
import {
  priceAt, playerBuyPrice, playerSellPrice, applyTradeToStock, driftZoneMarket, MATERIAL_KEYS,
} from '../engines/marketEngine.js';
import { effectiveStats, resolveDuel, garrisonPower } from '../engines/fleetEngine.js';

const getShipDef = (id) => shipsConfig.ships.find((s) => s.id === id);
const getUpgrade = (id) => shipsConfig.upgrades.find((u) => u.id === id);
const SHIP_NAMES = ['Intrépido', 'Soberbia', 'San Rafael', 'Fortuna', 'Audaz', 'Centinela', 'Tempestad', 'Esperanza', 'Relámpago', 'Constancia', 'Vencedor', 'Galán'];

function notify(s, type, message, duration = 3800) {
  s.notifications = [...s.notifications, { id: Date.now() + Math.random(), type, message, duration }];
}
const has = (res, cost) => Object.entries(cost || {}).every(([r, v]) => (res[r]?.amount ?? 0) >= v);
function spend(s, cost) { const r = { ...s.resources }; Object.entries(cost).forEach(([k, v]) => { r[k] = { ...r[k], amount: r[k].amount - v }; }); s.resources = r; }
function gain(s, key, amount) { const r = { ...s.resources }; r[key] = { ...r[key], amount: (r[key]?.amount ?? 0) + amount }; s.resources = r; }
const portById = (s, id) => s.ports.find((p) => p.id === id);
const segmentById = (s, id) => s.segments.find((n) => n.id === id);
function updatePort(s, id, patch) { s.ports = s.ports.map((p) => p.id === id ? { ...p, ...patch } : p); }
function updateSegment(s, id, patch) { s.segments = s.segments.map((n) => n.id === id ? { ...n, ...patch } : n); }
const bump = (v, a) => Math.min(1, (v || 0) + a);

export function gameReducer(state, action) {
  const s = { ...state };

  switch (action.type) {
    case 'TICK': {
      const now = action.now;
      s.tick += 1;
      if (!s._lastCycleAt) s._lastCycleAt = 0;
      if (now - s._lastCycleAt >= 4000) {
        s._lastCycleAt = now;

        // 1) Market drift at every port
        s.ports = s.ports.map((p) => ({ ...p, market: driftZoneMarket({ ...p, material: null }) }));

        // 2) Controlled rail segments feed their port if upkeep is paid.
        let upkeepTotal = 0;
        s.segments.forEach((n) => {
          if (n.owner !== 'player' || (n.control || 0) < 0.5) return;
          upkeepTotal += n.upkeep;
        });
        if (upkeepTotal > 0 && s.resources.oro.amount >= upkeepTotal) {
          spend(s, { oro: upkeepTotal });
          s.segments.forEach((n) => {
            if (n.owner !== 'player' || (n.control || 0) < 0.5 || !n.material) return;
            const port = portById(s, n.portId);
            if (!port || port.owner !== 'player') return;
            const produced = Math.round(3 * (n.control));
            updatePort(s, port.id, { market: applyTradeToStock(port.market, n.material, produced) });
            gain(s, n.material, Math.max(1, Math.round(produced * 0.6)));
          });
        } else if (upkeepTotal > 0) {
          s.segments = s.segments.map((n) => n.owner === 'player' ? { ...n, control: Math.max(0, (n.control || 0) - 0.1) } : n);
          notify(s, 'warning', 'Sin oro para mantener tus vías: pierdes control de la red.');
        }

        // 3) Sea routes process
        processSeaRoutes(s, now);

        // 4) Loan interest
        if (s.loans.length) s.loans = s.loans.map((l) => ({ ...l, due: Math.round(l.due * (1 + l.rate / 100 / 10)) }));
      }
      s.notifications = s.notifications.filter((n) => {
        if (!n._shownAt) n._shownAt = now;
        return now - n._shownAt < (n.duration || 3800);
      });
      return s;
    }

    // ── TIERRA: trabajar/mantener un tramo de vía (sube control) ──
    case 'WORK_VIA': {
      const seg = segmentById(s, action.segmentId); if (!seg) return s;
      const port = portById(s, seg.portId);
      if (!port || port.owner !== 'player') { notify(s, 'warning', 'Primero debes controlar el puerto de esta vía.'); return s; }
      const cost = { oro: 40 + seg.upkeep * 6 };
      if (!has(s.resources, cost)) { notify(s, 'warning', 'Sin oro para invertir en la vía.'); return s; }
      spend(s, cost);
      const newControl = bump(seg.control, 0.25);
      updateSegment(s, seg.id, { control: newControl, owner: newControl >= 0.5 ? 'player' : seg.owner });
      notify(s, 'success', `Tramo reforzado (${Math.round(newControl * 100)}% control).`);
      return s;
    }

    // ── Comercio en el mercado de un puerto ──
    case 'BUY': {
      const p = portById(s, action.portId); if (!p) return s;
      const { material, units } = action;
      const price = playerBuyPrice(p, material, p.influence || 0);
      const stock = Math.floor(p.market?.[material] ?? 0);
      const qty = Math.min(units, stock, Math.floor(s.resources.oro.amount / Math.max(price, 1)));
      if (qty <= 0) { notify(s, 'warning', 'No puedes comprar (sin oro o sin stock).'); return s; }
      spend(s, { oro: qty * price }); gain(s, material, qty);
      updatePort(s, p.id, { market: applyTradeToStock(p.market, material, -qty), influence: bump(p.influence, qty / 400) });
      notify(s, 'success', `Compraste ${qty} ${s.resources[material].label} a ${price}🪙.`);
      return s;
    }
    case 'SELL': {
      const p = portById(s, action.portId); if (!p) return s;
      const { material, units } = action;
      const have = Math.floor(s.resources[material]?.amount ?? 0);
      const qty = Math.min(units, have);
      if (qty <= 0) { notify(s, 'warning', 'No tienes esa mercancía.'); return s; }
      const price = playerSellPrice(p, material, p.influence || 0);
      spend(s, { [material]: qty }); gain(s, 'oro', qty * price);
      updatePort(s, p.id, { market: applyTradeToStock(p.market, material, qty), influence: bump(p.influence, qty / 400) });
      notify(s, 'success', `Vendiste ${qty} ${s.resources[material].label} a ${price}🪙 (+${qty * price}🪙).`);
      return s;
    }

    // ── MAR: rutas entre puertos ──
    case 'CREATE_SEA_ROUTE': {
      const stops = action.stops || [];
      if (stops.length < 2) { notify(s, 'warning', 'Una ruta marítima necesita al menos 2 puertos.'); return s; }
      const route = {
        id: `sea_${++s.routeCounter}`, name: action.name || `Ruta ${s.routeCounter}`,
        stops, shipIds: action.shipIds || [], auto: action.auto ?? true,
        legIndex: 0, nextMoveAt: action.now || Date.now(), active: (action.shipIds || []).length > 0,
      };
      s.ships = s.ships.map((sh) => route.shipIds.includes(sh.id) ? { ...sh, status: 'trading', routeId: route.id } : sh);
      s.seaRoutes = [...s.seaRoutes, route];
      s.ui = { ...s.ui, openSheet: 'routes' };
      notify(s, 'success', `🧭 ${route.name} en marcha.`);
      return s;
    }
    case 'TOGGLE_ROUTE_AUTO':
      s.seaRoutes = s.seaRoutes.map((r) => r.id === action.routeId ? { ...r, auto: !r.auto } : r); return s;
    case 'DELETE_ROUTE': {
      const r = s.seaRoutes.find((x) => x.id === action.routeId);
      if (r) s.ships = s.ships.map((sh) => r.shipIds.includes(sh.id) ? { ...sh, status: 'idle', routeId: null, cargo: {} } : sh);
      s.seaRoutes = s.seaRoutes.filter((x) => x.id !== action.routeId);
      notify(s, 'info', 'Ruta disuelta.');
      return s;
    }

    // ── Crédito ──
    case 'TAKE_LOAN': {
      const { principal, rate, term } = action;
      if (s.loans.reduce((a, l) => a + l.due, 0) > 6000) { notify(s, 'warning', 'Crédito al límite.'); return s; }
      gain(s, 'oro', principal);
      s.loans = [...s.loans, { id: `loan_${++s.loanCounter}`, principal, rate, due: Math.round(principal * (1 + rate / 100)), term }];
      notify(s, 'success', `🏦 Préstamo de ${principal}🪙 al ${rate}%.`);
      return s;
    }
    case 'REPAY_LOAN': {
      const loan = s.loans.find((l) => l.id === action.loanId); if (!loan) return s;
      const pay = Math.min(loan.due, action.amount ?? loan.due);
      if (s.resources.oro.amount < pay) { notify(s, 'warning', 'Sin oro suficiente.'); return s; }
      spend(s, { oro: pay });
      const rem = loan.due - pay;
      if (rem <= 0) { s.loans = s.loans.filter((l) => l.id !== loan.id); notify(s, 'success', 'Deuda saldada.'); }
      else { s.loans = s.loans.map((l) => l.id === loan.id ? { ...l, due: rem } : l); notify(s, 'info', `Restan ${rem}🪙.`); }
      return s;
    }

    // ── Militar: conquistar un puerto rival ──
    case 'CONTEST_PORT': {
      const p = portById(s, action.portId);
      if (!p || !p.owner || p.owner === 'player') return s;
      const idle = s.ships.filter((sh) => sh.status === 'idle');
      if (!idle.length) { notify(s, 'warning', 'No tienes barcos libres.'); return s; }
      const conflict = { id: `cf_${Date.now()}`, portId: p.id, portName: p.name, rival: p.owner, terrain: 'coast', garrison: garrisonPower({ tier: p.tier }, Math.random) };
      s.conflicts = [...s.conflicts, conflict];
      s.ui = { ...s.ui, conflictId: conflict.id, openSheet: 'duel' };
      return s;
    }
    case 'RESOLVE_CONFLICT': {
      const c = s.conflicts.find((x) => x.id === action.conflictId); if (!c) return s;
      const fleet = s.ships.filter((sh) => action.shipIds.includes(sh.id) && sh.status === 'idle');
      if (!fleet.length) { notify(s, 'warning', 'Asigna barcos al duelo.'); return s; }
      const result = resolveDuel(fleet, c.garrison, c.terrain, Math.random);
      const ids = fleet.map((f) => f.id); let sunk = 0;
      s.ships = s.ships.map((sh) => {
        if (!ids.includes(sh.id)) return sh;
        const hp = Math.max(0, (sh.hpPct ?? 1) - result.damagePct);
        return { ...sh, hpPct: hp, status: hp <= 0.1 ? 'sunk' : 'idle' };
      }).filter((sh) => { if (sh.status === 'sunk' && sunk < result.losses) { sunk++; return false; } return true; });
      if (result.win) updatePort(s, c.portId, { owner: 'player', influence: 0.4 });
      s.conflicts = s.conflicts.filter((x) => x.id !== c.id);
      s.ui = { ...s.ui, conflictId: null, openSheet: null };
      const report = `${result.win ? '🏴‍☠️ ¡Victoria!' : '⚓ Derrota'} en ${c.portName}. Poder ${result.playerPower} vs ${result.enemyPower}. ${result.message}` + (sunk ? ` Perdiste ${sunk} barco(s).` : '');
      s.lastBattleReport = { ...result, report, portName: c.portName };
      notify(s, result.win ? 'success' : 'warning', report, 6000);
      return s;
    }
    case 'DISMISS_BATTLE_REPORT': s.lastBattleReport = null; return s;

    // ── Barcos ──
    case 'BUILD_SHIP': {
      const def = getShipDef(action.shipId); if (!def) return s;
      if (!has(s.resources, def.cost)) { notify(s, 'warning', 'Recursos insuficientes.'); return s; }
      spend(s, def.cost);
      const name = SHIP_NAMES[s.shipCounter % SHIP_NAMES.length];
      s.ships = [...s.ships, { id: `ship_${++s.shipCounter}`, configId: def.id, name, class: def.class, icon: def.icon, hpPct: 1, upgrades: {}, status: 'idle', routeId: null, cargo: {} }];
      notify(s, 'success', `🚢 Botado el ${def.name} «${name}».`);
      return s;
    }
    case 'UPGRADE_SHIP': {
      const ship = s.ships.find((x) => x.id === action.shipId); const up = getUpgrade(action.upgradeId);
      if (!ship || !up) return s;
      const level = ship.upgrades?.[up.id] || 0;
      if (level >= up.max) { notify(s, 'info', `${up.name} al máximo.`); return s; }
      const cost = {}; Object.entries(up.costPerLevel).forEach(([r, v]) => { cost[r] = v * (level + 1); });
      if (!has(s.resources, cost)) { notify(s, 'warning', 'Recursos insuficientes.'); return s; }
      spend(s, cost);
      s.ships = s.ships.map((x) => x.id === ship.id ? { ...x, upgrades: { ...x.upgrades, [up.id]: level + 1 } } : x);
      notify(s, 'success', `${up.icon} ${ship.name}: ${up.name} Nv ${level + 1}.`);
      return s;
    }
    case 'REPAIR_SHIP': {
      const ship = s.ships.find((x) => x.id === action.shipId);
      if (!ship || (ship.hpPct ?? 1) >= 1) return s;
      const cost = { oro: 60, madera: 30 };
      if (!has(s.resources, cost)) { notify(s, 'warning', 'Recursos insuficientes.'); return s; }
      spend(s, cost);
      s.ships = s.ships.map((x) => x.id === ship.id ? { ...x, hpPct: 1 } : x);
      notify(s, 'success', `🔧 ${ship.name} reparado.`);
      return s;
    }

    // ── UI ──
    case 'OPEN_SHEET':   s.ui = { ...s.ui, openSheet: action.sheet }; return s;
    case 'CLOSE_SHEET':  s.ui = { ...s.ui, openSheet: null, conflictId: null }; return s;
    case 'SELECT_PORT':    s.ui = { ...s.ui, openSheet: action.id ? 'port' : s.ui.openSheet }; s.map = { ...s.map, selectedPortId: action.id, selectedSegmentId: null }; return s;
    case 'SELECT_SEGMENT': s.ui = { ...s.ui, openSheet: action.id ? 'segment' : s.ui.openSheet }; s.map = { ...s.map, selectedSegmentId: action.id, selectedPortId: null }; return s;
    case 'SET_MAP_VIEW': s.map = { ...s.map, view: action.view }; return s;
    case 'DISMISS_NOTIFICATION': s.notifications = s.notifications.filter((n) => n.id !== action.id); return s;

    case 'LOAD_STATE': {
      const fresh = createInitialState();
      const loaded = { ...fresh, ...action.state, ui: { ...fresh.ui, ...action.state.ui }, map: { ...fresh.map, ...action.state.map } };
      loaded.seaRoutes = loaded.seaRoutes || [];
      loaded.loans = loaded.loans || [];
      return loaded;
    }

    default: return state;
  }
}

// ── Sea route processing: auto buy-low/sell-high between ports ──
function processSeaRoutes(s, now) {
  if (!s.seaRoutes.length) return;
  s.seaRoutes = s.seaRoutes.map((route) => {
    if (!route.active || route.shipIds.length === 0 || now < route.nextMoveAt) return route;
    const port = portById(s, route.stops[route.legIndex % route.stops.length]);
    if (!port) return route;
    if (route.auto) {
      const capacity = route.shipIds.reduce((sum, id) => { const sh = s.ships.find((x) => x.id === id); return sum + (sh ? effectiveStats(sh).bodega : 0); }, 0);
      let market = { ...port.market };
      const carried = {};
      s.ships.filter((sh) => route.shipIds.includes(sh.id)).forEach((sh) => Object.entries(sh.cargo || {}).forEach(([m, q]) => { carried[m] = (carried[m] || 0) + q; }));
      Object.entries(carried).forEach(([m, q]) => { const sell = playerSellPrice({ ...port, market }, m, port.influence || 0); gain(s, 'oro', q * sell); market = applyTradeToStock(market, m, q); });
      s.ships = s.ships.map((sh) => route.shipIds.includes(sh.id) ? { ...sh, cargo: {} } : sh);
      let cheapest = null;
      MATERIAL_KEYS.forEach((m) => { const p = priceAt({ ...port, market }, m); if (!cheapest || p < cheapest.p) cheapest = { m, p }; });
      if (cheapest) {
        const qty = Math.max(0, Math.min(capacity, Math.floor(s.resources.oro.amount / Math.max(cheapest.p, 1)), Math.floor(market[cheapest.m] ?? 0)));
        if (qty > 0) { spend(s, { oro: qty * cheapest.p }); market = applyTradeToStock(market, cheapest.m, -qty); s.ships = s.ships.map((sh) => sh.id === route.shipIds[0] ? { ...sh, cargo: { ...(sh.cargo || {}), [cheapest.m]: (sh.cargo?.[cheapest.m] || 0) + qty } } : sh); }
      }
      updatePort(s, port.id, { market, influence: bump(port.influence, 0.01) });
    }
    const speeds = route.shipIds.map((id) => { const sh = s.ships.find((x) => x.id === id); return sh ? effectiveStats(sh).velocidad : 5; });
    const legMs = Math.max(3000, 9000 - (speeds.length ? Math.min(...speeds) : 5) * 400);
    return { ...route, legIndex: route.legIndex + 1, nextMoveAt: now + legMs };
  });
}
