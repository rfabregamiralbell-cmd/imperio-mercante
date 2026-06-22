import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state/initialState.js';
import { gameReducer } from '../src/state/gameReducer.js';
import { priceAt, playerBuyPrice, playerSellPrice } from '../src/engines/marketEngine.js';
import { effectiveStats, resolveDuel } from '../src/engines/fleetEngine.js';

const rich = () => { const s = createInitialState(); s.resources.oro.amount = 9000; s.resources.madera.amount = 900; s.resources.hierro.amount = 600; return s; };

describe('world & markets', () => {
  it('every zone has a market', () => {
    const s = createInitialState();
    expect(s.zones.every((z) => z.market && Object.keys(z.market).length > 0)).toBe(true);
  });
  it('a material is cheaper where it is produced', () => {
    const s = createInitialState();
    const prod = s.zones.find((z) => z.material === 'tabaco');
    const other = s.zones.find((z) => z.material !== 'tabaco');
    expect(priceAt(prod, 'tabaco')).toBeLessThan(priceAt(other, 'tabaco'));
  });
});

describe('dynamic trade', () => {
  it('buying reduces stock and raises price; goods enter warehouse', () => {
    let s = createInitialState();
    const z = s.zones.find((x) => x.owner === null);
    const stock0 = z.market[z.material];
    const p0 = priceAt(z, z.material);
    s = gameReducer(s, { type: 'BUY', zoneId: z.id, material: z.material, units: 30 });
    const zz = s.zones.find((x) => x.id === z.id);
    expect(zz.market[z.material]).toBeLessThan(stock0);
    expect(priceAt(zz, z.material)).toBeGreaterThanOrEqual(p0);
    expect(s.resources[z.material].amount).toBeGreaterThan(0);
  });
  it('selling yields gold and grows zone influence', () => {
    let s = createInitialState();
    s.resources.tabaco.amount = 20;
    const z = s.zones.find((x) => x.material !== 'tabaco');
    const oro0 = s.resources.oro.amount;
    s = gameReducer(s, { type: 'SELL', zoneId: z.id, material: 'tabaco', units: 10 });
    expect(s.resources.oro.amount).toBeGreaterThan(oro0);
    expect(s.zones.find((x) => x.id === z.id).influence).toBeGreaterThan(0);
  });
  it('arbitrage is positive: sell dear > buy cheap', () => {
    const s = createInitialState();
    const cheap = s.zones.find((x) => x.material === 'especias');
    const dear = s.zones.find((x) => x.material !== 'especias');
    expect(playerSellPrice(dear, 'especias', 0)).toBeGreaterThan(playerBuyPrice(cheap, 'especias', 0));
  });
});

describe('credit', () => {
  it('loan adds gold and records debt with interest', () => {
    let s = createInitialState();
    const oro0 = s.resources.oro.amount;
    s = gameReducer(s, { type: 'TAKE_LOAN', principal: 1000, rate: 20, term: 10 });
    expect(s.resources.oro.amount).toBe(oro0 + 1000);
    expect(s.loans[0].due).toBe(1200);
  });
  it('repaying clears the loan', () => {
    let s = createInitialState();
    s = gameReducer(s, { type: 'TAKE_LOAN', principal: 1000, rate: 20, term: 10 });
    s = gameReducer(s, { type: 'REPAY_LOAN', loanId: s.loans[0].id });
    expect(s.loans.length).toBe(0);
  });
});

describe('routes', () => {
  it('creates a route and assigns ships', () => {
    let s = rich();
    s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'galeon' });
    const stops = [s.zones[0].id, s.zones[5].id];
    s = gameReducer(s, { type: 'CREATE_ROUTE', stops, shipIds: [s.ships[0].id], auto: true, now: 1000 });
    expect(s.routes.length).toBe(1);
    expect(s.ships[0].status).toBe('trading');
  });
  it('an auto route advances stops over cycles', () => {
    let s = rich();
    s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'galeon' });
    const stops = [s.zones[0].id, s.zones[5].id, s.zones[9].id];
    s = gameReducer(s, { type: 'CREATE_ROUTE', stops, shipIds: [s.ships[0].id], auto: true, now: 1000 });
    let t = 1000;
    for (let i = 0; i < 6; i++) { t += 5000; s._lastCycleAt = t - 5000; s = gameReducer(s, { type: 'TICK', now: t }); }
    expect(s.routes[0].legIndex).toBeGreaterThan(0);
  });
});

describe('military', () => {
  it('a strong fleet conquers a rival zone', () => {
    let s = rich();
    for (let i = 0; i < 3; i++) s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'navio' });
    const rival = s.zones.find((z) => z.owner && z.owner !== 'player');
    s = gameReducer(s, { type: 'CONTEST_ZONE', zoneId: rival.id });
    s.conflicts[0].garrison = 1;
    s = gameReducer(s, { type: 'RESOLVE_CONFLICT', conflictId: s.conflicts[0].id, shipIds: s.ships.map((x) => x.id) });
    expect(s.zones.find((z) => z.id === rival.id).owner).toBe('player');
  });
  it('coast terrain gives a maneuver bonus', () => {
    const ships = [{ configId: 'fragata', hpPct: 1, upgrades: {} }];
    const seed = () => 0.5;
    expect(resolveDuel(ships, 200, 'coast', seed).ratio).toBeGreaterThan(resolveDuel(ships, 200, 'open_sea', seed).ratio);
  });
});

describe('ships', () => {
  it('upgrades raise effective stats', () => {
    let s = rich();
    s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'fragata' });
    const before = effectiveStats(s.ships[0]).canones;
    s = gameReducer(s, { type: 'UPGRADE_SHIP', shipId: s.ships[0].id, upgradeId: 'canones' });
    expect(effectiveStats(s.ships[0]).canones).toBeGreaterThan(before);
  });
});

describe('persistence', () => {
  it('LOAD_STATE preserves zones, routes and markets', () => {
    let s = rich();
    s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'galeon' });
    s = gameReducer(s, { type: 'CREATE_ROUTE', stops: [s.zones[0].id, s.zones[1].id], shipIds: [s.ships[0].id], auto: true, now: 1 });
    const re = gameReducer(createInitialState(), { type: 'LOAD_STATE', state: JSON.parse(JSON.stringify(s)) });
    expect(re.routes.length).toBe(s.routes.length);
    expect(re.zones[0].market).toBeTruthy();
  });
});
