# ⚓ Imperio Mercante

Juego de **logística y comercio naval** mobile-first sobre un **mapa mundi real**, en dos capas conectadas.

## Dos capas
**🚉 Tierra (interior → puerto):** el interior produce materiales (minas, bosques, haciendas reales: Potosí, Zacatecas, el Ruhr, Pittsburgh…) que llegan a las ciudades portuarias por **vías** ramificadas, dibujadas sobre el mapa. Trabajas y mantienes una vía hasta **poseerla**: se ilumina con tu color y su producción fluye a tu puerto. Si no pagas su mantenimiento, la pierdes.

**🌊 Mar (puerto → puerto):** cada puerto es un **mercado dinámico** (oferta/demanda: comprar sube el precio, vender lo baja). Creas **rutas marítimas** entre puertos para comerciar (en automático compran barato y venden caro), las **defiendes** y **conquistas** puertos rivales con tu flota.

## Pilares
- **Logística** — controla las vías del interior para abastecer tus puertos.
- **Comercio** — arbitraje entre mercados de puerto; crédito 🏦 para invertir.
- **Influencia** — comerciar en un puerto/vía aumenta tu peso y te da mejores precios.
- **Militar** 🚢 — barcos con tipos históricos y mejoras; escoltan rutas y toman puertos (duelos auto-resueltos con terreno costa/mar abierto).

## Mundo
17 puertos reales en 13 países (América, Europa, África, Asia/Pacífico) y 25 nodos interiores reales unidos por vías. Tu base: **Cartagena**.

## Jugar
```bash
npm install
npm run dev      # localhost:5173
npm test
npm run build
```
Navegación: **Mundo · Rutas · Flota · Banca**. Toca un puerto ⚓ para su mercado; un nodo 🚉 para trabajar su vía.


## Vías reales
La capa **OpenRailwayMap** se superpone al mapa base y dibuja las vías ferroviarias **reales** del mundo (se ven al ejecutar con internet). Encima, el juego coloca los **puertos** (puntos) y los **tramos jugables** que tu compañía controla, iluminados con tu color. Así las vías son reales y tú gestionas tu red encima.

## Stack
React + Vite + Leaflet + react-leaflet. Reducer puro, autoguardado en localStorage. Vías como poli-líneas curvas (origen/destino reales; el trazado ferroviario exacto GIS queda como fase futura). Duelo naval 2D táctico (estilo Batalla del Nilo) pendiente; el motor ya distingue costa/mar abierto. Rivales IA por ligas, preparado para multijugador real.
