// ============================================================
// GAME STATE + REDUCER — Imperio Mercante (primer bucle)
// Vías ferroviarias extraen materiales (auto) → almacén del puerto base.
// Comercias en puertos (precios dinámicos). Inviertes en flota
// comercial (mueve mercancía) y militar (defiende/ataca).
// ============================================================

import world from '../config/world_config.json';
import { seedMarket, priceAt, applyTrade, driftMarket, MATERIAL_KEYS } from '../engines/marketEngine.js';

const HOME = world.ports.find((p) => p.home)?.id || 'cartagena';

// Ship blueprints (comercial / militar)
export const SHIP_TYPES = {
  balandra: { id: 'balandra', name: 'Balandra', kind: 'comercial', icon: '⛵', cost: 150, cargo: 25, power: 3 },
  galeon:   { id: 'galeon',   name: 'Galeón',   kind: 'comercial', icon: '🚢', cost: 480, cargo: 70, power: 8 },
  fragata:  { id: 'fragata',  name: 'Fragata',  kind: 'militar',   icon: '⚔️', cost: 420, cargo: 10, power: 28 },
  navio:    { id: 'navio',    name: 'Navío',    kind: 'militar',   icon: '🛡️', cost: 900, cargo: 15, power: 60 },
};

export function createInitialState() {
  const ports = world.ports.map((p) => ({
    id: p.id, name: p.name, coords: p.coords, home: !!p.home,
    owner: p.owner || null,
    market: seedMarket(),
  }));
  const vias = world.vias.map((v) => ({
    id: v.id, name: v.name, material: v.material, port: v.port,
    owner: v.port === HOME ? 'player' : null,
    rate: 4,
  }));

  const warehouse = {};
  MATERIAL_KEYS.forEach((m) => { warehouse[m] = 0; });

  return {
    tick: 0,
    oro: 1200,
    warehouse,
    ports,
    vias,
    ships: [],
    shipCounter: 0,
    ui: { sheet: null, selectedPortId: null, selectedViaId: null },
    notifications: [],
    _lastCycle: 0,
  };
}

let NID = 0;
function notify(s, type, message) {
  s.notifications = [...s.notifications, { id: `${Date.now()}_${NID++}`, type, message }];
}

export function reducer(state, action) {
  const s = { ...state };
  switch (action.type) {
    case 'TICK': {
      const now = action.now;
      s.tick += 1;
      if (now - s._lastCycle >= 3000) {
        s._lastCycle = now;
        const wh = { ...s.warehouse };
        s.vias.forEach((v) => { if (v.owner === 'player') wh[v.material] = (wh[v.material] || 0) + v.rate; });
        s.warehouse = wh;
        s.ports = s.ports.map((p) => ({ ...p, market: driftMarket(p.market) }));
      }
      if (s.notifications.length > 4) s.notifications = s.notifications.slice(-4);
      return s;
    }

    case 'SELL': {
      const port = s.ports.find((p) => p.id === action.portId);
      const { material, units } = action;
      const have = s.warehouse[material] || 0;
      const qty = Math.min(units, have);
      if (qty <= 0) { notify(s, 'warn', 'No tienes esa mercancía.'); return s; }
      const price = priceAt(port, material);
      s.oro += qty * price;
      s.warehouse = { ...s.warehouse, [material]: have - qty };
      s.ports = s.ports.map((p) => p.id === port.id ? { ...p, market: applyTrade(p.market, material, qty) } : p);
      notify(s, 'ok', `Vendiste ${qty} ${material} a ${price}🪙 (+${qty * price}).`);
      return s;
    }

    case 'BUY': {
      const port = s.ports.find((p) => p.id === action.portId);
      const { material, units } = action;
      const price = priceAt(port, material);
      const stock = Math.floor(port.market[material] ?? 0);
      const qty = Math.min(units, stock, Math.floor(s.oro / Math.max(price, 1)));
      if (qty <= 0) { notify(s, 'warn', 'Sin oro o sin stock.'); return s; }
      s.oro -= qty * price;
      s.warehouse = { ...s.warehouse, [material]: (s.warehouse[material] || 0) + qty };
      s.ports = s.ports.map((p) => p.id === port.id ? { ...p, market: applyTrade(p.market, material, -qty) } : p);
      notify(s, 'ok', `Compraste ${qty} ${material} a ${price}🪙 (−${qty * price}).`);
      return s;
    }

    case 'BUILD_SHIP': {
      const t = SHIP_TYPES[action.shipType];
      if (!t) return s;
      if (s.oro < t.cost) { notify(s, 'warn', 'Oro insuficiente.'); return s; }
      s.oro -= t.cost;
      s.ships = [...s.ships, { id: `ship_${++s.shipCounter}`, type: t.id, kind: t.kind }];
      notify(s, 'ok', `${t.icon} ${t.name} botado.`);
      return s;
    }

    case 'OPEN_SHEET':     s.ui = { ...s.ui, sheet: action.sheet }; return s;
    case 'CLOSE_SHEET':    s.ui = { ...s.ui, sheet: null, selectedPortId: null, selectedViaId: null }; return s;
    case 'SELECT_PORT':    s.ui = { ...s.ui, sheet: action.id ? 'port' : s.ui.sheet, selectedPortId: action.id, selectedViaId: null }; return s;
    case 'SELECT_VIA':     s.ui = { ...s.ui, sheet: action.id ? 'via' : s.ui.sheet, selectedViaId: action.id, selectedPortId: null }; return s;
    default: return state;
  }
}
