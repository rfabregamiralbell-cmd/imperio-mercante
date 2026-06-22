# ⚓ Imperio Mercante

Juego de estrategia naval mobile-first sobre un **mapa mundi real**. Tres pilares: **Influencia · Comercio · Poder militar**.

Extiendes tu influencia controlando **barrios** (en ciudades) y **comarcas** (fuera). Cada zona extrae un **material**; lo vendes por **oro**, que reinviertes en **expandir** o en **flota militar**. Las zonas rivales se disputan en **duelos de flotas** donde el terreno (costa vs mar abierto) importa.

## Jugar
```bash
npm install
npm run dev      # desarrollo
npm test         # suite de pruebas
npm run build    # build de producción
```

## Bucle de juego
1. **Imperio** 🏛️ — mira tus zonas y su producción; reclama zonas libres con influencia + oro.
2. **Comercio** ⚖️ — vende materiales por oro (el comercio sube tu influencia).
3. **Flota** 🚢 — construye barcos (tipos históricos), mejóralos (casco/cañones/velamen/bodega) y repáralos.
4. **Mundo** 🌍 — toca una zona del mapa: reclámala si es libre, o disputa con tu flota si es rival.

## Pilares
- **Influencia** 🚩 — crece con el comercio (base) y la inversión (dirige la expansión). Pinta tus zonas en el mapa.
- **Comercio** — materiales extraídos → oro. Cada región rinde algo distinto (Nueva York ≠ Cabo Verde).
- **Militar** — flota con stats y mejoras hiperrealistas. Duelos auto-resueltos con parte de batalla (la vista táctica 2D llegará después; el motor ya distingue costa/mar abierto).

## Stack
React + Vite + Leaflet + react-leaflet. Mapa mundi real (CARTO Voyager). Estado en reducer puro, autoguardado en localStorage. Mundo compartido por ligas (rivales IA) preparado para multijugador real más adelante.
