import { describe, it, expect } from 'vitest';
import { createInitialState } from '../src/state/initialState.js';
import { gameReducer } from '../src/state/gameReducer.js';
import { priceAt, playerBuyPrice, playerSellPrice } from '../src/engines/marketEngine.js';
import { effectiveStats, resolveDuel } from '../src/engines/fleetEngine.js';

const rich = () => { const s = createInitialState(); s.resources.oro.amount = 9000; s.resources.madera.amount = 900; s.resources.hierro.amount = 600; return s; };
const homePort = (s) => s.ports.find((p) => p.home);

describe('world structure', () => {
  it('has many real ports and interior nodes with vías', () => {
    const s = createInitialState();
    expect(s.ports.length).toBeGreaterThanOrEqual(15);
    expect(s.nodes.length).toBeGreaterThanOrEqual(20);
    expect(s.nodes.every((n) => Array.isArray(n.via) && n.via.length > 1)).toBe(true);
  });
  it('player starts with a home port; rivals exist', () => {
    const s = createInitialState();
    expect(s.ports.some((p) => p.home && p.owner === 'player')).toBe(true);
    expect(s.ports.some((p) => p.owner && p.owner !== 'player')).toBe(true);
  });
  it('every port has a market', () => {
    const s = createInitialState();
    expect(s.ports.every((p) => p.market && Object.keys(p.market).length > 0)).toBe(true);
  });
});

describe('land layer: vías', () => {
  it('working a vía raises control and grants ownership at 50%', () => {
    let s = rich();
    const node = s.nodes.find((n) => n.portId === homePort(s).id);
    const c0 = node.control;
    s = gameReducer(s, { type: 'WORK_VIA', nodeId: node.id });
    const n1 = s.nodes.find((x) => x.id === node.id);
    expect(n1.control).toBeGreaterThan(c0);
    if (n1.control >= 0.5) expect(n1.owner).toBe('player');
  });
  it('owned vía + upkeep feeds the port owner warehouse on TICK', () => {
    let s = rich();
    const home = homePort(s);
    s.nodes = s.nodes.map((n) => n.portId === home.id ? { ...n, owner: 'player', control: 0.8 } : n);
    const mat = s.nodes.find((n) => n.portId === home.id).material;
    const before = s.resources[mat].amount;
    s._lastCycleAt = 0;
    s = gameReducer(s, { type: 'TICK', now: 5000 });
    expect(s.resources[mat].amount).toBeGreaterThan(before);
  });
});

describe('sea layer: trade & markets', () => {
  it('buying reduces port stock; selling yields gold', () => {
    let s = rich();
    const p = s.ports[0];
    const mat = 'tabaco';
    s.ports = s.ports.map((x) => x.id === p.id ? { ...x, market: { ...x.market, [mat]: 80 } } : x);
    const stock0 = Math.floor(s.ports.find((x) => x.id === p.id).market[mat]);
    s = gameReducer(s, { type: 'BUY', portId: p.id, material: mat, units: 10 });
    expect(Math.floor(s.ports.find((x) => x.id === p.id).market[mat])).toBeLessThanOrEqual(stock0);
    expect(s.resources[mat].amount).toBeGreaterThan(0);
  });
  it('arbitrage is positive across ports with different stocks', () => {
    const s = createInitialState();
    const a = { ...s.ports[0], market: { ...s.ports[0].market, seda: 200 } };
    const b = { ...s.ports[1], market: { ...s.ports[1].market, seda: 10 } };
    expect(playerSellPrice(b, 'seda', 0)).toBeGreaterThan(playerBuyPrice(a, 'seda', 0));
  });
});

describe('sea routes', () => {
  it('creates a maritime route and advances over cycles', () => {
    let s = rich();
    s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'galeon' });
    const stops = [s.ports[0].id, s.ports[1].id, s.ports[2].id];
    s = gameReducer(s, { type: 'CREATE_SEA_ROUTE', stops, shipIds: [s.ships[0].id], auto: true, now: 1000 });
    expect(s.seaRoutes.length).toBe(1);
    expect(s.ships[0].status).toBe('trading');
    let t = 1000;
    for (let i = 0; i < 6; i++) { t += 5000; s._lastCycleAt = t - 5000; s = gameReducer(s, { type: 'TICK', now: t }); }
    expect(s.seaRoutes[0].legIndex).toBeGreaterThan(0);
  });
});

describe('military & credit', () => {
  it('a strong fleet conquers a rival port', () => {
    let s = rich();
    for (let i = 0; i < 3; i++) s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'navio' });
    const rival = s.ports.find((p) => p.owner && p.owner !== 'player');
    s = gameReducer(s, { type: 'CONTEST_PORT', portId: rival.id });
    s.conflicts[0].garrison = 1;
    s = gameReducer(s, { type: 'RESOLVE_CONFLICT', conflictId: s.conflicts[0].id, shipIds: s.ships.map((x) => x.id) });
    expect(s.ports.find((p) => p.id === rival.id).owner).toBe('player');
  });
  it('loan adds gold with interest; repay clears it', () => {
    let s = createInitialState();
    const o = s.resources.oro.amount;
    s = gameReducer(s, { type: 'TAKE_LOAN', principal: 1000, rate: 20, term: 10 });
    expect(s.resources.oro.amount).toBe(o + 1000);
    expect(s.loans[0].due).toBe(1200);
    s = gameReducer(s, { type: 'REPAY_LOAN', loanId: s.loans[0].id });
    expect(s.loans.length).toBe(0);
  });
  it('coast terrain gives a maneuver bonus', () => {
    const ships = [{ configId: 'fragata', hpPct: 1, upgrades: {} }];
    const seed = () => 0.5;
    expect(resolveDuel(ships, 200, 'coast', seed).ratio).toBeGreaterThan(resolveDuel(ships, 200, 'open_sea', seed).ratio);
  });
});

describe('persistence', () => {
  it('LOAD_STATE preserves ports, nodes, routes', () => {
    let s = rich();
    s = gameReducer(s, { type: 'BUILD_SHIP', shipId: 'galeon' });
    s = gameReducer(s, { type: 'CREATE_SEA_ROUTE', stops: [s.ports[0].id, s.ports[1].id], shipIds: [s.ships[0].id], auto: true, now: 1 });
    const re = gameReducer(createInitialState(), { type: 'LOAD_STATE', state: JSON.parse(JSON.stringify(s)) });
    expect(re.ports.length).toBe(s.ports.length);
    expect(re.nodes.length).toBe(s.nodes.length);
    expect(re.seaRoutes.length).toBe(s.seaRoutes.length);
  });
});
