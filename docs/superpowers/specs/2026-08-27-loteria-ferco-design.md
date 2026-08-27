# Lotería Virtual FERCO — Diseño

**Fecha:** 2026-08-27
**Repo:** https://github.com/giancaremma50-hue/Loter-a-FERCO (público, vacío)
**Motivo:** celebración fiestas patrias. Sesiones medianas simultáneas en GT, SV, HN, MX.

## 1. Stack

- Frontend: Vite + React + TypeScript (SPA), deploy en Vercel desde el repo GitHub.
- Backend/estado: Supabase (Postgres + Realtime). Sin servidor propio.
- QR: librería `qrcode` (npm).
- Sin SSR/Next.js: no hay contenido público ni SEO, es una app por link/QR.

## 2. Temática de imágenes (16, 100% FERCO)

Imágenes reales verificadas en ferco.com.gt (homepage, `<img>` src exacto):
Pisos cerámicos, Pisos porcelanato, Pisos Blandos, Fachaletas, Azulejos,
Grifería baños, Baños, Grifería cocina, Cocina, Muebles de casa, Adhesivos,
Inspiración madera, Cementicios, Marmoleado, Decorados, Piedras.

El logo Ferco GTM se usa en el header de la app, no como ficha del mazo.

Ficha de marcado: imagen local del frijol (ya en el repo) — clic marca, clic de nuevo desmarca.

## 3. Modelo de datos (Supabase, prefijo `loteria_`)

- `loteria_rooms`: id, code (6 chars único), country (opcional), status
  (`waiting`|`playing`|`verifying`|`finished`), pattern
  (`linea`|`esquinas`|`lleno`|...), drawn_pieces (int[]), created_at.
- `loteria_card_templates`: id, grid (16 claves de imagen en orden). Catálogo
  pregenerado, ~30 arreglos únicos.
- `loteria_players`: id, room_id, name, template_id, confirmed (bool),
  marks (bool[16]), joined_at.
- Imágenes: manifest estático en el código (no va en DB, es fijo).

Infra Supabase: se reutiliza el proyecto existente `giancaremma50-hue's
Project` (ya tiene tablas de otra app — `products`, `leads`, etc. — pero
Postgres soporta múltiples apps en el mismo proyecto sin choque; las tablas
de lotería van con prefijo `loteria_` y RLS propio). Evita pagar $10/mes por
un proyecto nuevo dedicado.

## 4. Flujo (máquina de estados de sala)

```
waiting → playing → verifying → waiting (reinicio)
```

- **waiting**: jugadores entran por `/unirse/:code`, ponen nombre, eligen
  cartón del catálogo visual (o "sorpréndeme" = aleatorio), confirman. Admin
  puede forzar confirmación/asignación aleatoria a quien falte.
- **playing**: admin saca fichas de la tómbola digital (una a la vez,
  animada, sin repetir). Jugadores marcan/desmarcan su cartón con clic.
- **verifying**: un jugador presiona "¡LOTERÍA!" → admin ve su cartón con
  las fichas llamadas resaltadas, confirma o rechaza contra el patrón activo.
- **reinicio**: vuelve a `waiting` con los mismos jugadores; cada uno decide
  mantener su cartón o cambiarlo: confirman de nuevo, arranca otra ronda.

## 5. Pantallas

- `/crear` (admin): genera sala → código + QR + link para compartir.
- `/unirse/:code` (jugador): nombre + catálogo de cartones.
- `/sala/:code` (jugador): tablero 4x4, clic marca/desmarca, botón
  **¡LOTERÍA!**.
- `/sala/:code/admin`: lista de jugadores + confirmados, tómbola, selector
  de patrón por ronda, panel de verificación, botón reiniciar.

## 6. Casos borde

- Código de sala inválido → mensaje de error, no crashea.
- Refresh del jugador → recupera su cartón vía localStorage
  (`room_code` + `player_id`).
- Admin cierra pestaña → la sala sigue viva en Supabase, se reabre con el
  mismo link.
- Dos jugadores gritan lotería casi junto → se encolan, admin revisa uno
  por uno.

## 7. Verificación

- `checkWin(marks, pattern, drawnPieces)` es la única lógica no trivial
  (pura, sin efectos secundarios) → 1 test con `assert` cubre línea,
  esquinas y cartón lleno.
- El resto (UI, tiempo real) se prueba a mano en navegador antes de dar
  por listo.

## Decisiones confirmadas (2026-08-27)

- Supabase: se reutiliza el proyecto existente `giancaremma50-hue's Project`
  (id `fcqomskbbyvqhtlgqlai`), tablas con prefijo `loteria_`. Sin costo extra.
- Imágenes: se descargan de ferco.com.gt a `/public/images/deck`.
- Push a GitHub: autorizado, normal a medida que se avanza.
