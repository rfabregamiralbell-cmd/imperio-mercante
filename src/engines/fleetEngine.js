// ============================================================
// FLEET ENGINE — ship effective stats (with upgrades) + naval duel
// Duels are auto-resolved now; the terrain ('coast' vs 'open_sea')
// modifies the outcome, ready for a 2D tactical layer later.
// ============================================================

import shipsConfig from '../config/ships_config.json';

const getShipDef = (id) => shipsConfig.ships.find((s) => s.id === id);
const getUpgrade = (id) => shipsConfig.upgrades.find((u) => u.id === id);

// Effective stats of a ship after applying its upgrade levels.
export function effectiveStats(ship) {
  const def = getShipDef(ship.configId);
  if (!def) return { casco: 0, canones: 0, velocidad: 0, bodega: 0 };
  const stats = { ...def.stats };
  Object.entries(ship.upgrades || {}).forEach(([upId, level]) => {
    const up = getUpgrade(upId);
    if (!up || !level) return;
    stats[up.stat] = Math.round(stats[up.stat] * (1 + up.perLevel * level));
  });
  return stats;
}

// Combat power of a single ship: cannons do damage, hull sustains it.
export function shipPower(ship) {
  const s = effectiveStats(ship);
  const hpFactor = Math.max(0.2, (ship.hpPct ?? 1));
  return Math.round((s.canones * 2 + s.casco * 0.5) * hpFactor);
}

// Total power of a fleet (array of ships).
export function fleetPower(ships) {
  return ships.reduce((sum, s) => sum + shipPower(s), 0);
}

/**
 * Auto-resolve a naval duel between the player's fleet and an enemy power.
 * terrain: 'coast' (defender/maneuver bonus) | 'open_sea' (pure power).
 * @returns {{ win:boolean, ratio:number, playerPower:number, enemyPower:number,
 *             losses:number, damagePct:number, message:string, terrain:string }}
 */
export function resolveDuel(playerShips, enemyPower, terrain = 'open_sea', rng = Math.random) {
  let pPower = fleetPower(playerShips);
  // Coastal duels reward the smaller/defending fleet (maneuver, shoals).
  const coastBonus = terrain === 'coast' ? 1.2 : 1.0;
  const luck = 0.85 + rng() * 0.3;
  const effective = pPower * coastBonus * luck;
  const ratio = effective / Math.max(enemyPower, 1);
  const win = ratio >= 1;

  // Damage taken scales inversely with how dominant you were.
  const damagePct = Math.max(0.05, Math.min(0.9, 0.5 / Math.max(ratio, 0.3)));
  // How many ships are lost (sunk) — only on clear defeats or close wins.
  let losses = 0;
  if (!win && ratio < 0.6) losses = Math.min(playerShips.length, Math.ceil(playerShips.length * 0.5));
  else if (!win) losses = Math.min(playerShips.length, 1);
  else if (ratio < 1.3) losses = rng() < 0.3 ? 1 : 0;

  const message = win
    ? (ratio >= 1.6 ? 'Victoria aplastante. La zona es tuya.' : 'Victoria ajustada. Tomas la zona.')
    : (ratio < 0.6 ? 'Derrota severa. Tu flota se retira maltrecha.' : 'Derrota por poco. Reagrupa y vuelve a intentarlo.');

  return { win, ratio: Math.round(ratio * 100) / 100, playerPower: pPower, enemyPower, losses, damagePct, message, terrain };
}

// Enemy garrison power defending a rival zone (scales with tier).
export function garrisonPower(zone, rng = Math.random) {
  const t = zone.tier || 1;
  return Math.round((40 + t * 60) * (0.8 + rng() * 0.5));
}
