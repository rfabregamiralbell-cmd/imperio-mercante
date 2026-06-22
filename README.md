# ⚓ Imperio Mercante — base

Punto de partida limpio: **mapa mundi a pantalla completa** con dos capas reales superpuestas y un selector para encenderlas/apagarlas. Sobre esta base construiremos las mecánicas (puertos, vías, comercio, flota…).


## Bucle de juego (v1)
- **Vías ferroviarias** (líneas desde el interior) extraen materiales **automáticamente** hacia tu almacén. Tócalas para ver qué producen.
- **Puertos**: tócalos para abrir su **mercado**. Precios **dinámicos** — vender baja el precio local, comprar lo sube. Beneficio por arbitraje entre puertos.
- **Flota**: invierte oro en barcos **comerciales** (mueven mercancía) y **militares** (defensa/ataque). Botón Flota abajo.
- Empiezas con Cartagena como puerto base y sus vías; otros puertos están en manos de compañías rivales.

## Rutas navales (2D)
Rutas marítimas dibujadas como **arcos curvos de color por océano** (Atlántico, Índico, Pacífico) con flecha de dirección, estilo mapa histórico UNESCO, entre 32 puertos reales. Adaptadas al mapa 2D (curvas que abrazan los océanos), sin dependencias externas en runtime.

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
