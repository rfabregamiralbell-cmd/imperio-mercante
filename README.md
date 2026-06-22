# ⚓ Imperio Mercante

Juego de **comercio naval** mobile-first sobre un **mapa mundi real**. Oferta y demanda dinámicas, rutas con barcos, crédito e influencia comercial. Menos conquista, más mercado.

## La idea
Cada zona del mundo (barrios en ciudades, comarcas fuera) tiene un **mercado** con precios que suben y bajan según oferta y demanda. El beneficio nace del **arbitraje**: compra barato donde un material sobra, véndelo caro donde escasea. Reinviertes en **más barcos y rutas** o en **crédito** para crecer rápido; y donde más comercias, más **influencia** ganas (mejores precios). Las zonas en manos rivales se toman con tu **flota**.

## Cuatro pilares
- **Comercio dinámico** — comprar sube el precio local, vender lo baja. Cada zona produce algo distinto (Nueva York hierro, Cabo Verde especias, Potosí plata…).
- **Rutas** 🧭 — define circuitos con paradas y asigna barcos; en modo automático compran barato y venden caro solos.
- **Crédito** 🏦 — pide oro prestado y devuélvelo con interés para financiar tu expansión.
- **Militar** 🚢 — barcos con tipos históricos y mejoras (casco/cañones/velamen/bodega); escoltan rutas y conquistan zonas rivales en duelos navales (auto-resueltos, con terreno costa/mar abierto).

## Jugar
```bash
npm install
npm run dev      # desarrollo (localhost:5173)
npm test         # pruebas
npm run build    # producción
```
Navegación: **Mundo · Rutas · Flota · Banca**. Toca una zona del mapa para ver su mercado y comerciar.

## Stack
React + Vite + Leaflet + react-leaflet. Mapa real (CARTO Voyager). Estado en reducer puro, autoguardado en localStorage. Mundo compartido por ligas (rivales IA) preparado para multijugador real más adelante. Duelo naval 2D táctico (estilo Batalla del Nilo) pendiente como siguiente fase; el motor ya distingue costa/mar abierto.
