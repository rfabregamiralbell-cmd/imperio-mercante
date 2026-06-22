// ============================================================
// MARKET ENGINE — dynamic supply & demand per port.
// Each port holds a stock per material. Price rises when scarce,
// falls when abundant. Buying raises the local price; selling lowers it.
// ============================================================

import world from '../config/world_config.json';

export const MATERIALS = world.materials;
export const MATERIAL_KEYS = Object.keys(world.materials);

const ELASTICITY = 0.6;
const MIN_FACTOR = 0.45;
const MAX_FACTOR = 2.4;
const TARGET = 60;        // stock the port "wants"

export function basePrice(m) { return MATERIALS[m]?.base ?? 4; }

export function priceAt(port, m) {
  const base = basePrice(m);
  const stock = port.market?.[m] ?? TARGET;
  let f = Math.pow(TARGET / Math.max(stock, 1), ELASTICITY);
  f = Math.max(MIN_FACTOR, Math.min(MAX_FACTOR, f));
  return Math.max(1, Math.round(base * f));
}

export function seedMarket() {
  const m = {};
  MATERIAL_KEYS.forEach((k) => { m[k] = TARGET; });
  return m;
}

// delta>0: player sold into port (stock up → cheaper). delta<0: bought (scarcer → pricier).
export function applyTrade(market, m, delta) {
  const next = { ...market };
  next[m] = Math.max(0, (next[m] ?? TARGET) + delta);
  return next;
}

// Gentle drift back toward equilibrium each cycle.
export function driftMarket(market) {
  const next = { ...market };
  MATERIAL_KEYS.forEach((k) => {
    const v = next[k] ?? TARGET;
    next[k] = v + (TARGET - v) * 0.05;
  });
  return next;
}
