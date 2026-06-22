// ============================================================
// GAME REDUCER — Imperio Mercante (trade model)
// Comercio (oferta/demanda dinámica) · Rutas (circuitos con barcos) ·
// Crédito (préstamos con interés) · Militar (escolta + control de zonas) ·
// Influencia (peso comercial → mejores precios).
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
const zoneById = (s, id) => s.zones.find((z) => z.id === id);
function updateZone(s, id, patch) { s.zones = s.zones.map((z) => z.id === id ? { ...z, ...patch } : z); }
const bumpInfluence = (zone, amount) => Math.min(1, (zone.influence || 0) + amount);

export function gameReducer(state, action) {
  const s = { ...state };

  switch (action.type) {
    case 'TICK': {
      const now = action.now;
      s.tick += 1;
      if (!s._lastCycleAt) s._lastCycleAt = 0;
      if (now - s._lastCycleAt >= 4000) {
        s._lastCycleAt = now;
        s.zones = s.zones.map((z) => ({ ...z, market: driftZoneMarket(z) }));
        processRoutes(s, now);
        if (s.loans.length) s.loans = s.loans.map((l) => ({ ...l, due: Math.round(l.due * (1 + l.rate / 100 / 10)) }));
      }
      s.notifications = s.notifications.filter((n) => {
        if (!n._shownAt) n._shownAt = now;
        return now - n._shownAt < (n.duration || 3800);
      });
      return s;
    }

    case 'BUY': {
      const zone = zoneById(s, action.zoneId); if (!zone) return s;
      const { material, units } = action;
      const price = playerBuyPrice(zone, material, zone.influence || 0);
      const stock = zone.market?.[material] ?? 0;
      const qty = Math.min(units, Math.floor(stock), Math.floor(s.resources.oro.amount / Math.max(price, 1)));
      if (qty <= 0) { notify(s, 'warning', 'No puedes comprar (sin oro o sin stock).'); return s; }
      const cost = qty * price;
      spend(s, { oro: cost });
      gain(s, material, qty);
      updateZone(s, zone.id, { market: applyTradeToStock(zone.market, material, -qty), influence: bumpInfluence(zone, qty / 400) });
      notify(s, 'success', `Compraste ${qty} ${s.resources[material].label} a ${price}🪙 (${cost}🪙).`);
      return s;
    }

    case 'SELL': {
      const zone = zoneById(s, action.zoneId); if (!zone) return s;
      const { material, units } = action;
      const have = s.resources[material]?.amount ?? 0;
      const qty = Math.min(units, Math.floor(have));
      if (qty <= 0) { notify(s, 'warning', 'No tienes esa mercancía.'); return s; }
      const price = playerSellPrice(zone, material, zone.influence || 0);
      const gold = qty * price;
      spend(s, { [material]: qty });
      gain(s, 'oro', gold);
      updateZone(s, zone.id, { market: applyTradeToStock(zone.market, material, qty), influence: bumpInfluence(zone, qty / 400) });
      notify(s, 'success', `Vendiste ${qty} ${s.resources[material].label} a ${price}🪙 (+${gold}🪙).`);
      return s;
    }

    case 'CREATE_ROUTE': {
      const stops = action.stops || [];
      if (stops.length < 2) { notify(s, 'warning', 'Una ruta necesita al menos 2 paradas.'); return s; }
      const route = {
        id: `route_${++s.routeCounter}`, name: action.name || `Ruta ${s.routeCounter}`,
        stops, shipIds: action.shipIds || [], auto: action.auto ?? true,
        legIndex: 0, nextMoveAt: action.now || Date.now(), active: (action.shipIds || []).length > 0,
      };
      s.ships = s.ships.map((sh) => route.shipIds.includes(sh.id) ? { ...sh, status: 'trading', routeId: route.id } : sh);
      s.routes = [...s.routes, route];
      s.ui = { ...s.ui, openSheet: 'routes' };
      notify(s, 'success', `🧭 ${route.name} creada con ${route.shipIds.length} barco(s).`);
      return s;
    }

    case 'TOGGLE_ROUTE_AUTO':
      s.routes = s.routes.map((r) => r.id === action.routeId ? { ...r, auto: !r.auto } : r);
      return s;

    case 'DELETE_ROUTE': {
      const route = s.routes.find((r) => r.id === action.routeId);
      if (route) s.ships = s.ships.map((sh) => route.shipIds.includes(sh.id) ? { ...sh, status: 'idle', routeId: null, cargo: {} } : sh);
      s.routes = s.routes.filter((r) => r.id !== action.routeId);
      notify(s, 'info', 'Ruta disuelta. Barcos liberados.');
      return s;
    }

    case 'TAKE_LOAN': {
      const { principal, rate, term } = action;
      const totalDebt = s.loans.reduce((sum, l) => sum + l.due, 0);
      if (totalDebt > 5000) { notify(s, 'warning', 'Crédito al límite. Salda deudas primero.'); return s; }
      gain(s, 'oro', principal);
      s.loans = [...s.loans, { id: `loan_${++s.loanCounter}`, principal, rate, due: Math.round(principal * (1 + rate / 100)), term }];
      notify(s, 'success', `🏦 Préstamo de ${principal}🪙 al ${rate}%. A devolver ${Math.round(principal * (1 + rate / 100))}🪙.`);
      return s;
    }

    case 'REPAY_LOAN': {
      const loan = s.loans.find((l) => l.id === action.loanId); if (!loan) return s;
      const pay = Math.min(loan.due, action.amount ?? loan.due);
      if (s.resources.oro.amount < pay) { notify(s, 'warning', 'Sin oro suficiente para pagar.'); return s; }
      spend(s, { oro: pay });
      const remaining = loan.due - pay;
      if (remaining <= 0) { s.loans = s.loans.filter((l) => l.id !== loan.id); notify(s, 'success', 'Deuda saldada.'); }
      else { s.loans = s.loans.map((l) => l.id === loan.id ? { ...l, due: remaining } : l); notify(s, 'info', `Abonaste ${pay}🪙. Restan ${remaining}🪙.`); }
      return s;
    }

    case 'CONTEST_ZONE': {
      const zone = zoneById(s, action.zoneId);
      if (!zone || !zone.owner || zone.owner === 'player') return s;
      const idle = s.ships.filter((sh) => sh.status === 'idle');
      if (!idle.length) { notify(s, 'warning', 'No tienes barcos libres para el duelo.'); return s; }
      const conflict = { id: `cf_${Date.now()}`, zoneId: zone.id, zoneName: zone.name, rival: zone.owner, terrain: zone.kind === 'barrio' ? 'coast' : 'open_sea', garrison: garrisonPower(zone, Math.random) };
      s.conflicts = [...s.conflicts, conflict];
      s.ui = { ...s.ui, conflictId: conflict.id, openSheet: 'duel' };
      return s;
    }

    case 'RESOLVE_CONFLICT': {
      const conflict = s.conflicts.find((c) => c.id === action.conflictId); if (!conflict) return s;
      const fleet = s.ships.filter((sh) => action.shipIds.includes(sh.id) && sh.status === 'idle');
      if (!fleet.length) { notify(s, 'warning', 'Asigna al menos un barco al duelo.'); return s; }
      const result = resolveDuel(fleet, conflict.garrison, conflict.terrain, Math.random);
      const fleetIds = fleet.map((f) => f.id);
      let sunk = 0;
      s.ships = s.ships.map((sh) => {
        if (!fleetIds.includes(sh.id)) return sh;
        const newHp = Math.max(0, (sh.hpPct ?? 1) - result.damagePct);
        return { ...sh, hpPct: newHp, status: newHp <= 0.1 ? 'sunk' : 'idle' };
      }).filter((sh) => { if (sh.status === 'sunk' && sunk < result.losses) { sunk++; return false; } return true; });
      if (result.win) updateZone(s, conflict.zoneId, { owner: 'player', influence: 0.4 });
      s.conflicts = s.conflicts.filter((c) => c.id !== conflict.id);
      s.ui = { ...s.ui, conflictId: null, openSheet: null };
      const report = `${result.win ? '🏴‍☠️ ¡Victoria!' : '⚓ Derrota'} en ${conflict.zoneName} (${conflict.terrain === 'coast' ? 'combate costero' : 'mar abierto'}). Tu poder ${result.playerPower} vs ${result.enemyPower}. ${result.message}` + (sunk > 0 ? ` Perdiste ${sunk} barco(s).` : '');
      s.lastBattleReport = { ...result, report, zoneName: conflict.zoneName };
      notify(s, result.win ? 'success' : 'warning', report, 6000);
      return s;
    }

    case 'DISMISS_BATTLE_REPORT': s.lastBattleReport = null; return s;

    case 'BUILD_SHIP': {
      const def = getShipDef(action.shipId); if (!def) return s;
      if (!has(s.resources, def.cost)) { notify(s, 'warning', 'Recursos insuficientes para el barco.'); return s; }
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
      if (level >= up.max) { notify(s, 'info', `${up.name} ya al máximo.`); return s; }
      const cost = {}; Object.entries(up.costPerLevel).forEach(([r, v]) => { cost[r] = v * (level + 1); });
      if (!has(s.resources, cost)) { notify(s, 'warning', 'Recursos insuficientes para la mejora.'); return s; }
      spend(s, cost);
      s.ships = s.ships.map((x) => x.id === ship.id ? { ...x, upgrades: { ...x.upgrades, [up.id]: level + 1 } } : x);
      notify(s, 'success', `${up.icon} ${ship.name}: ${up.name} a nivel ${level + 1}.`);
      return s;
    }

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

    case 'OPEN_SHEET':      s.ui = { ...s.ui, openSheet: action.sheet }; return s;
    case 'CLOSE_SHEET':     s.ui = { ...s.ui, openSheet: null, conflictId: null }; return s;
    case 'SELECT_ZONE':     s.ui = { ...s.ui, openSheet: action.id ? 'zone' : s.ui.openSheet }; s.map = { ...s.map, selectedZoneId: action.id }; return s;
    case 'SET_MAP_VIEW':    s.map = { ...s.map, view: action.view }; return s;
    case 'DISMISS_NOTIFICATION': s.notifications = s.notifications.filter((n) => n.id !== action.id); return s;

    case 'LOAD_STATE': {
      const fresh = createInitialState();
      const loaded = { ...fresh, ...action.state, ui: { ...fresh.ui, ...action.state.ui }, map: { ...fresh.map, ...action.state.map } };
      loaded.routes = loaded.routes || [];
      loaded.loans = loaded.loans || [];
      return loaded;
    }

    default:
      return state;
  }
}

// ── Route processing: ships hop stops; auto buys cheap / sells dear ──
function processRoutes(s, now) {
  if (!s.routes.length) return;
  s.routes = s.routes.map((route) => {
    if (!route.active || route.shipIds.length === 0) return route;
    if (now < route.nextMoveAt) return route;
    const stops = route.stops;
    const zone = zoneById(s, stops[route.legIndex % stops.length]);
    if (!zone) return route;

    if (route.auto) {
      const capacity = route.shipIds.reduce((sum, id) => {
        const sh = s.ships.find((x) => x.id === id); return sum + (sh ? effectiveStats(sh).bodega : 0);
      }, 0);
      let market = { ...zone.market };
      const routeShips = s.ships.filter((sh) => route.shipIds.includes(sh.id));
      const carried = {};
      routeShips.forEach((sh) => Object.entries(sh.cargo || {}).forEach(([m, q]) => { carried[m] = (carried[m] || 0) + q; }));
      Object.entries(carried).forEach(([m, q]) => {
        const sell = playerSellPrice({ ...zone, market }, m, zone.influence || 0);
        gain(s, 'oro', q * sell);
        market = applyTradeToStock(market, m, q);
      });
      s.ships = s.ships.map((sh) => route.shipIds.includes(sh.id) ? { ...sh, cargo: {} } : sh);

      let cheapest = null;
      MATERIAL_KEYS.forEach((m) => { const p = priceAt({ ...zone, market }, m); if (!cheapest || p < cheapest.p) cheapest = { m, p }; });
      if (cheapest) {
        const affordable = Math.floor(s.resources.oro.amount / Math.max(cheapest.p, 1));
        const stock = Math.floor(market[cheapest.m] ?? 0);
        const qty = Math.max(0, Math.min(capacity, affordable, stock));
        if (qty > 0) {
          spend(s, { oro: qty * cheapest.p });
          market = applyTradeToStock(market, cheapest.m, -qty);
          s.ships = s.ships.map((sh) => sh.id === route.shipIds[0] ? { ...sh, cargo: { ...(sh.cargo || {}), [cheapest.m]: (sh.cargo?.[cheapest.m] || 0) + qty } } : sh);
        }
      }
      updateZone(s, zone.id, { market, influence: bumpInfluence(zone, 0.01) });
    }

    const speeds = route.shipIds.map((id) => { const sh = s.ships.find((x) => x.id === id); return sh ? effectiveStats(sh).velocidad : 5; });
    const slowest = speeds.length ? Math.min(...speeds) : 5;
    const legMs = Math.max(3000, 9000 - slowest * 400);
    return { ...route, legIndex: route.legIndex + 1, nextMoveAt: now + legMs };
  });
}
