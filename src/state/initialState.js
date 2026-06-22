// ============================================================
// INITIAL STATE — Imperio Mercante (red ferroviaria mundial)
// El mundo es una red: ciudades-nodo unidas por tramos de vía (edges).
// Los puertos son ciudades costeras donde se comercia (mercado) y nacen
// las rutas marítimas. Controlas tramos de vía (se iluminan con tu color).
// ============================================================

import world from '../config/world_config.json';
import { seedMarket } from '../engines/marketEngine.js';

const HOME_PORT = 'cartagena';

function build() {
  const cityById = {};
  world.cities.forEach((c) => { cityById[c.id] = c; });

  // Ports (tradeable) — markets live here
  const ports = world.cities.filter((c) => c.port).map((c) => {
    const home = c.id === HOME_PORT;
    // Assign an initial rival owner to some notable ports for tension
    const rival = RIVALS[c.id] || null;
    return {
      id: c.id, name: c.name, coords: c.coords,
      home, owner: home ? 'player' : rival,
      influence: home ? 0.4 : 0,
      market: seedMarket({ material: null, tier: 2 }),
    };
  });

  // Rail segments (edges). Each can be controlled by the player (0..1).
  const segments = world.edges.map((e, i) => {
    const ca = cityById[e.a], cb = cityById[e.b];
    // artery weight by whether it links to a port + material value
    const mat = ca.material || cb.material;
    const base = mat ? (world.materials[mat]?.base || 4) : 4;
    return {
      id: `seg_${i}`, a: e.a, b: e.b, via: e.via,
      material: mat || null,
      arteryWeight: 2 + Math.min(1.6, base / 10),
      control: 0, owner: null,
      portId: ca.port ? ca.id : (cb.port ? cb.id : nearestPortId(ca.coords, ports)),
      upkeep: 2 + Math.round(base / 5),
    };
  });

  return { ports, segments, cities: world.cities };
}

const RIVALS = {
  lahabana: 'Cofradía del Caribe',
  newyork: 'Compañía del Norte',
  liverpool: 'Compañía del Norte',
  sevilla: 'Casa de Contratación',
  canton: 'Compañía de las Indias',
  calcuta: 'Compañía de las Indias',
  manila: 'Galeón de Manila',
  callao: 'Virreinato del Perú',
};

function nearestPortId(coords, ports) {
  let best = null, bd = Infinity;
  ports.forEach((p) => {
    const d = (p.coords[0] - coords[0]) ** 2 + (p.coords[1] - coords[1]) ** 2;
    if (d < bd) { bd = d; best = p.id; }
  });
  return best;
}

export function createInitialState() {
  const { ports, segments, cities } = build();
  return {
    version: '6.0.0',
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
      cacao:   { amount: 0,    icon: '🍫', label: 'Cacao' },
      trigo:   { amount: 0,    icon: '🌾', label: 'Trigo' },
    },

    ports,
    segments,
    cities,

    ships: [],
    shipCounter: 0,
    seaRoutes: [],
    routeCounter: 0,
    loans: [],
    loanCounter: 0,
    conflicts: [],

    map: { view: 'world', selectedPortId: null, selectedSegmentId: null },
    ui: { openSheet: null, conflictId: null },
    notifications: [],
  };
}
