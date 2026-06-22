// ============================================================
// INITIAL STATE — Imperio Mercante
// The world is a flat list of "zones" (barrios inside cities,
// comarcas outside). Controlling a zone yields its material.
// Three pillars: Influencia · Comercio · Poder militar.
// ============================================================

import world from '../config/world_config.json';

// Flatten world config into a single zones array with owner + city link.
function buildZones() {
  const zones = [];
  world.cities.forEach((city) => {
    (city.barrios || []).forEach((b) => {
      zones.push({
        id: b.id,
        name: b.name,
        kind: 'barrio',
        cityId: city.id,
        cityName: city.name,
        coords: city.coords,
        tier: city.tier,
        material: b.material,
        richness: b.richness,
        owner: b.rival ? b.rival : (city.home ? 'player' : null),
        home: !!city.home,
      });
    });
  });
  world.comarcas.forEach((c) => {
    zones.push({
      id: c.id,
      name: c.name,
      kind: 'comarca',
      cityId: null,
      cityName: null,
      coords: c.coords,
      tier: c.tier,
      material: c.material,
      richness: c.richness,
      owner: c.rival ? c.rival : null,
      home: false,
    });
  });
  return zones;
}

export function createInitialState() {
  return {
    version: '1.0.0',
    tick: 0,

    governor: { name: 'Gobernador', league: 1, renown: 0 },

    // Resources: oro (capital), influencia (puntos para expandir), + materials.
    resources: {
      oro:        { amount: 500,  icon: '🪙', label: 'Oro' },
      influencia: { amount: 0,    icon: '🚩', label: 'Influencia' },
      madera:     { amount: 60,   icon: '🪵', label: 'Madera' },
      hierro:     { amount: 20,   icon: '⛓️', label: 'Hierro' },
      tabaco:     { amount: 0,    icon: '🍂', label: 'Tabaco' },
      azucar:     { amount: 0,    icon: '🍯', label: 'Azúcar' },
      algodon:    { amount: 0,    icon: '🧺', label: 'Algodón' },
      especias:   { amount: 0,    icon: '🌶️', label: 'Especias' },
      plata:      { amount: 0,    icon: '⚪', label: 'Plata' },
      seda:       { amount: 0,    icon: '🧵', label: 'Seda' },
      vino:       { amount: 0,    icon: '🍷', label: 'Vino' },
      pescado:    { amount: 0,    icon: '🐟', label: 'Pescado' },
    },

    zones: buildZones(),

    ships: [],
    shipCounter: 0,

    // Pending conflicts when contesting a rival zone (auto/2D duel).
    conflicts: [],

    map: { view: 'world', selectedZoneId: null },

    ui: { openSheet: null, selectedShipId: null, conflictId: null },

    notifications: [],
  };
}
