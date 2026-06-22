// ============================================================
// INITIAL STATE — Imperio Mercante (logística en dos capas)
// TIERRA: nodos interiores → puerto por una VÍA que controlas con
//   influencia + mantenimiento. MAR: rutas entre puertos (defender/atacar).
// ============================================================

import world from '../config/world_config.json';
import { seedMarket } from '../engines/marketEngine.js';

// Flatten ports and interior nodes into game entities.
function buildWorld() {
  const ports = [];
  const nodes = [];   // interior production nodes, each linked to one port by a vía
  world.ports.forEach((p) => {
    ports.push({
      id: p.id, name: p.name, country: p.country, coords: p.coords, tier: p.tier,
      home: !!p.home,
      owner: p.home ? 'player' : (p.rival || null),
      influence: p.home ? 0.4 : 0,
      market: seedMarket({ material: null, tier: p.tier }),
    });
    (p.interior || []).forEach((n) => {
      nodes.push({
        id: n.id, name: n.name, coords: n.coords, material: n.material,
        portId: p.id, via: n.via,
        // The player "owns/works" the vía: 0..1. Owning it routes the node's
        // production into your port. Requires upkeep each cycle.
        control: p.home ? 0.5 : 0,
        owner: null,             // who controls the vía (player/rival/null)
        upkeep: 2 + (p.tier || 1),
      });
    });
  });
  return { ports, nodes };
}

export function createInitialState() {
  const { ports, nodes } = buildWorld();
  return {
    version: '3.0.0',
    tick: 0,
    governor: { name: 'Gobernador', league: 1 },

    resources: {
      oro:     { amount: 1500, icon: '🪙', label: 'Oro' },
      madera:  { amount: 40,   icon: '🪵', label: 'Madera' },
      hierro:  { amount: 15,   icon: '⛓️', label: 'Hierro' },
      carbon:  { amount: 0,    icon: '⚫', label: 'Carbón' },
      tabaco:  { amount: 0,    icon: '🍂', label: 'Tabaco' },
      azucar:  { amount: 0,    icon: '🍯', label: 'Azúcar' },
      algodon: { amount: 0,    icon: '🧺', label: 'Algodón' },
      cafe:    { amount: 0,    icon: '☕', label: 'Café' },
      especias:{ amount: 0,    icon: '🌶️', label: 'Especias' },
      plata:   { amount: 0,    icon: '⚪', label: 'Plata' },
      oro_m:   { amount: 0,    icon: '🟡', label: 'Oro en bruto' },
      seda:    { amount: 0,    icon: '🧵', label: 'Seda' },
      te:      { amount: 0,    icon: '🍵', label: 'Té' },
      vino:    { amount: 0,    icon: '🍷', label: 'Vino' },
      lana:    { amount: 0,    icon: '🐑', label: 'Lana' },
    },

    ports,
    nodes,

    ships: [],
    shipCounter: 0,

    seaRoutes: [],     // maritime routes between ports
    routeCounter: 0,

    loans: [],
    loanCounter: 0,

    conflicts: [],

    map: { view: 'world', selectedPortId: null, selectedNodeId: null },
    ui: { openSheet: null, conflictId: null },
    notifications: [],
  };
}
