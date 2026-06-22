# ⚓ Imperio Mercante — base

Punto de partida limpio: **mapa mundi a pantalla completa** con dos capas reales superpuestas y un selector para encenderlas/apagarlas. Sobre esta base construiremos las mecánicas (puertos, vías, comercio, flota…).

## Capas
- **Mapa base** — CARTO Positron (claro, carreteras y costas visibles).
- **🚆 Tren** — OpenRailwayMap: red ferroviaria **real** del mundo.
- **⚓ Mar** — OpenSeaMap: señalización náutica **real**.

Las capas reales se ven al ejecutar con conexión a internet (el navegador pide sus teselas).

## Ejecutar
```bash
npm install
npm run dev      # localhost:5173
npm run build
```
Botones arriba a la derecha: alternan las capas de tren y mar.

## Stack
React + Vite + Leaflet + react-leaflet. Mobile-first. Despliegue en GitHub Pages (`base: '/imperio-mercante/'`).
