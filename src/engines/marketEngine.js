// ============================================================
// MARKET ENGINE — dynamic supply & demand per zone.
// Each zone has, per material, a "stock" and a baseline. Price rises
// when stock is scarce (high demand) and falls when abundant (high supply).
// Buying raises the local price; selling lowers it. Influence in a zone
// gives the player a better (more competitive) price.
// ============================================================

import world from '../config/world_config.json';

const MATERIALS = world.materials;
export const MATERIAL_KEYS = Object.keys(MATERIALS);

// Price model: price = base * (target / max(stock, 1))^elasticity, clamped.
const ELASTICITY = 0.6;
const MIN_FACTOR = 0.4;   // floor: never below 40% of base
const MAX_FACTOR = 2.6;   // ceiling: never above 260% of base

// The "target" stock each zone wants on hand for a material.
const TARGET_STOCK = 60;

export function basePrice(material) {
  return MATERIALS[material]?.base ?? 4;
}

/**
 * Current unit price of a material in a zone given its local stock.
 * Producer zones (their own material) keep more stock → cheaper there.
 */
export function priceAt(zone, material) {
  const base = basePrice(material);
  const stock = zone.market?.[material] ?? TARGET_STOCK;
  let factor = Math.pow(TARGET_STOCK / Math.max(stock, 1), ELASTICITY);
  factor = Math.max(MIN_FACTOR, Math.min(MAX_FACTOR, factor));
  return Math.max(1, Math.round(base * factor));
}

// Buy/sell price the PLAYER gets, improved by influence in that zone.
// influenceLevel 0..1 → up to 12% better (cheaper buys, richer sells).
export function playerBuyPrice(zone, material, influence01 = 0) {
  return Math.max(1, Math.round(priceAt(zone, material) * (1 - influence01 * 0.12)));
}
export function playerSellPrice(zone, material, influence01 = 0) {
  return Math.round(priceAt(zone, material) * (1 + influence01 * 0.12));
}

// Apply a trade to a zone's local stock (mutates a copy, returns it).
// delta > 0 means the player SOLD into the zone (stock up → price down);
// delta < 0 means the player BOUGHT from the zone (stock down → price up).
export function applyTradeToStock(market, material, delta) {
  const next = { ...market };
  next[material] = Math.max(0, (next[material] ?? TARGET_STOCK) + delta);
  return next;
}

// Natural drift: each cycle a zone produces its own material (supply) and
// consumes a bit of others (demand), nudging stocks toward equilibrium.
export function driftZoneMarket(zone) {
  const market = { ...(zone.market || {}) };
  MATERIAL_KEYS.forEach((m) => {
    if (market[m] == null) market[m] = TARGET_STOCK;
  });
  // Producer adds its own material (more supply → cheaper locally)
  const own = zone.material;
  if (own) market[own] = Math.min(market[own] + Math.round((zone.richness || 1) * 5), 200);
  // Demand: consume a little of everything, scaled by tier (richer zones consume more)
  MATERIAL_KEYS.forEach((m) => {
    if (m === own) return;
    const pull = (zone.tier || 1) * 0.8;
    market[m] = Math.max(8, market[m] - pull);
  });
  return market;
}

// Seed a fresh market for a zone: abundant in its own material, scarce-ish else.
export function seedMarket(zone) {
  const market = {};
  MATERIAL_KEYS.forEach((m) => { market[m] = TARGET_STOCK; });
  if (zone.material) market[zone.material] = 140; // producer → cheap there
  return market;
}

// Best arbitrage hint between two zones for the UI ("compra X aquí, vende allá").
export function bestArbitrage(fromZone, toZone) {
  let best = null;
  MATERIAL_KEYS.forEach((m) => {
    const buy = priceAt(fromZone, m);
    const sell = priceAt(toZone, m);
    const margin = sell - buy;
    if (!best || margin > best.margin) best = { material: m, buy, sell, margin };
  });
  return best;
}
