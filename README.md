# Lotería FERCO

Lotería virtual 4x4 para las fiestas patrias de FERCO. Vite + React + TS,
Supabase (Postgres + Realtime).

## Desarrollo local

1. Copiar `.env.example` a `.env` y completar `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` (proyecto Supabase `fcqomskbbyvqhtlgqlai`).
2. `npm install`
3. `npm run dev`
4. `npm test` corre las pruebas de `checkWin` y `generateTemplates`.

## Flujo de juego

1. Admin entra a `/` → crea sala → obtiene código, link y QR.
2. Colaboradores entran a `/unirse/:code`, ponen su nombre y eligen cartón.
3. Admin entra a `/sala/:code/admin`, elige patrón (línea, esquinas, cartón
   lleno), inicia la partida y va sacando fichas de la tómbola.
4. Jugadores marcan/desmarcan su cartón con clic en `/sala/:code`.
5. Al gritar "¡LOTERÍA!", el admin ve el cartón validado automáticamente y
   confirma o rechaza.
6. "Reiniciar partida" vuelve la sala a `waiting` sin perder jugadores.

## Deploy (Vercel)

1. Importar el repo `giancaremma50-hue/Loter-a-FERCO` en Vercel (framework
   preset: Vite).
2. En las variables de entorno del proyecto en Vercel, agregar
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con los mismos valores del
   `.env` local.
3. Deploy. Cada push a `main` despliega automáticamente.
