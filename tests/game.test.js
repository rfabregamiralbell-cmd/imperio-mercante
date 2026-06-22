import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state/initialState.js';
import { gameReducer } from '../src/state/gameReducer.js';
import { zoneYield, expansionCost, influencePerCycle, ownedZones } from '../src/engines/influenceEngine.js';
import { effectiveStats, fleetPower, resolveDuel } from '../src/engines/fleetEngine.js';

const fresh = () => {
  const s = createInitialState();
  s.resources.oro.amount = 5000;
  s.resources.madera.amount = 600;
  s.resources.hierro.amount = 400;
  s.resources.influencia.amount = 300;
  return s;
};

describe('initial world', () => {
  it('starts with the 3 Cartagena barrios owned by the player', () => {
    const s = createInitialState();
    expect(ownedZones(s.zones).length).toBe(3);
  });
  it('has rival and free zones', () => {
    const s = createInitialState();
    expect(s.zones.some((z) => z.owner && z.owner !== 'player')).toBe(true);
    expect(s.zones.some((z) => z.owner === null)).toBe(true);
  });
});

describe('economy', () => {
  it('TICK yields materials and influence from owned zones', () => {
    let s = createInitialState();
    s._lastCycleAt = 0;
    s = gameReducer(s, { type: 'TICK', now: 5000 });
    expect(s.resources.tabaco.amount).toBeGreaterThan(0);
    expect(s.resources.influencia.amount).toBeGreaterThan(0);
  });
  it('TRADE_ALL converts goods to gold', () => {
    let s = createInitialState();
    s.resources.tabaco.amount = 10;
    const before = s.resources.oro.amount;
    s = gameReducer(s, { type: 'TRADE_ALL' });
    expect(s.resources.oro.amount).toBeGreaterThan(before);
    expect(s.resources.tabaco.amount).toBe(0);
  });
});

describe('influence / expansion', () => {
  it('expands into a free zone for influence + gold', () => {
    let s = fresh();
    const free = s.zones.find((z) => z.owner === null);
    s = gameReducer(s, { type: 'EXPAND_ZONE', zoneId: free.id });
    expect(s.zones.find((z) => z.id === free.id).owner).toBe('player');
  });
  it('does NOT take a rival zone via expansion', () => {
    let s = fresh();
    const rival = s.zones.find((z) => z.owner && z.owner !== 'player');
    const owner = rival.owner;
    s = gameReducer(s, { type: 'EXPAND_ZONE', zoneId: rival.id });
    expect(s.zones.find((z) => z.id === rival.id).owner).toBe(owner);
  });
  it('expansion cost scales with tier', () => {
    expect(expansionCost({ tier: 3 }).oro).toBeGreaterThan(expansionCost({ tier: 1 }).oro);
  });
});

describe('fleet', () => {
  it('builds a named ship', () => {
    let s = fresh();
    s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'fragata' });
    expect(s.ships.length).toBe(1);
    expect(s.ships[0].name).toBeTruthy();
  });
  it('upgrades raise effective stats', () => {
    let s = fresh();
    s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'fragata' });
    const before = effectiveStats(s.ships[0]).canones;
    s = gameReducer(s, { type: 'UPGRADE_SHIP', shipId: s.ships[0].id, upgradeId: 'canones' });
    expect(effectiveStats(s.ships[0]).canones).toBeGreaterThan(before);
  });
});

describe('conflict / duel', () => {
  it('contesting a rival zone opens a conflict with terrain', () => {
    let s = fresh();
    s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'navio' });
    const rival = s.zones.find((z) => z.owner && z.owner !== 'player');
    s = gameReducer(s, { type: 'CONTEST_ZONE', zoneId: rival.id });
    expect(s.conflicts.length).toBe(1);
    expect(['coast', 'open_sea']).toContain(s.conflicts[0].terrain);
  });
  it('a strong fleet wins and takes the zone', () => {
    let s = fresh();
    // build a big fleet
    for (let i = 0; i < 3; i++) s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'navio' });
    const rival = s.zones.find((z) => z.owner && z.owner !== 'player');
    s = gameReducer(s, { type: 'CONTEST_ZONE', zoneId: rival.id });
    const cf = s.conflicts[0];
    // force a deterministic strong garrison by lowering it
    cf.garrison = 1;
    s = gameReducer(s, { type: 'RESOLVE_CONFLICT', conflictId: cf.id, shipIds: s.ships.map((x) => x.id) });
    expect(s.lastBattleReport.win).toBe(true);
    expect(s.zones.find((z) => z.id === rival.id).owner).toBe('player');
  });
  it('coast terrain gives a maneuver bonus over open sea', () => {
    const ships = [{ configId: 'fragata', hpPct: 1, upgrades: {} }];
    const seed = () => 0.5; // fixed luck
    const coast = resolveDuel(ships, 200, 'coast', seed);
    const open = resolveDuel(ships, 200, 'open_sea', seed);
    expect(coast.ratio).toBeGreaterThan(open.ratio);
  });
});

describe('persistence', () => {
  it('LOAD_STATE preserves zones and ships', () => {
    let s = fresh();
    s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'fragata' });
    const re = gameReducer(createInitialState(), { type: 'LOAD_STATE', state: JSON.parse(JSON.stringify(s)) });
    expect(re.ships.length).toBe(s.ships.length);
    expect(re.zones.length).toBe(s.zones.length);
  });
});
