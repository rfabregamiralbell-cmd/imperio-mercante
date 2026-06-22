// ============================================================
// INFLUENCE / ECONOMY ENGINE
// Controlling a zone yields its material each cycle. Trading
// materials → oro. Oro + influence → expand to new zones.
// ============================================================

import materialsWorld from '../config/world_config.json';

const MATERIALS = materialsWorld.materials;

// Material produced per cycle by a player-owned zone.
export function zoneYield(zone) {
  const base = MATERIALS[zone.material]?.base ?? 3;
  return Math.max(1, Math.round(base * (zone.richness || 1)));
}

// Sale price per unit of a material (oro).
export function materialPrice(material) {
  return MATERIALS[material]?.base ?? 3;
}

// Player-owned zones.
export function ownedZones(zones) {
  return zones.filter((z) => z.owner === 'player');
}

// Influence generated per cycle = sum over owned zones of tier-weighted value.
export function influencePerCycle(zones) {
  return ownedZones(zones).reduce((sum, z) => sum + z.tier * 2, 0);
}

// Cost to expand into a zone: scales with tier and richness.
export function expansionCost(zone) {
  const t = zone.tier || 1;
  return {
    influencia: 20 * t,
    oro: 120 * t,
  };
}

// Total materials produced per cycle, keyed by material.
export function materialsPerCycle(zones) {
  const out = {};
  ownedZones(zones).forEach((z) => {
    out[z.material] = (out[z.material] || 0) + zoneYield(z);
  });
  return out;
}
