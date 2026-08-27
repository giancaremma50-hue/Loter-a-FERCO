# Lotería Virtual FERCO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web app de lotería 4x4 en vivo para fiestas patrias FERCO — admin crea sala, colaboradores se unen por QR/link, eligen cartón, marcan con clic, admin corre la tómbola y verifica ganadores.

**Architecture:** SPA Vite + React + TypeScript, sin servidor propio. Supabase (Postgres + Realtime) guarda salas/jugadores/cartones y sincroniza en vivo vía `postgres_changes`. Deploy estático en Vercel desde el repo GitHub.

**Tech Stack:** Vite, React 18, TypeScript, react-router-dom, @supabase/supabase-js, qrcode, Vitest.

**Simplificación deliberada:** el botón de unirse a la sala (nombre + cartón) YA es la confirmación del jugador — no hay un paso separado de "confirmar". El botón "Iniciar partida" del admin es el corte real: todo el que se unió antes de esa acción juega. Si esto no alcanza, decilo y se agrega un paso de confirmación explícito.

---

## Contexto fijo para todas las tareas

- Repo: `C:\Users\giancarlo.lam\Downloads\Lotería FERCO` → GitHub `giancaremma50-hue/Loter-a-FERCO`, rama `main`.
- Supabase project id: `fcqomskbbyvqhtlgqlai` (ya existente, se reutiliza).
- Supabase URL: `https://fcqomskbbyvqhtlgqlai.supabase.co`
- Supabase publishable key: `sb_publishable_B8UpuoTJ9n2K6BqLG5GfVQ_wGA-Dwij`
- Todas las tablas nuevas usan prefijo `loteria_` para no chocar con las tablas existentes del proyecto (`products`, `leads`, etc.).
- Colores de marca FERCO (obligatorios, no cambiar): negro `#101820`, amarillo `#F0BE1A` (acento Cerámica), gris `#636569`, verde `#2C3A38`, blanco `#FFFFFF`. Logo siempre esquina superior izquierda, sin distorsionar ni recolorear.
- Las 16 imágenes del mazo son reales, tomadas de `ferco.com.gt` (URLs exactas en la Tarea 3).
- La ficha de marcado es la imagen ya presente en el repo: `pngwing.com - 2026-08-27T094737.276.png` (un frijol).

---

### Task 1: Scaffold Vite + React + TS

**Files:**
- Create: todo lo generado por `create-vite` (template `react-ts`) en la raíz del repo.
- Modify: `package.json` (agregar deps y script `test`).
- Create: `vitest.config.ts`

- [ ] **Step 1: Scaffold en carpeta temporal (evita el prompt de "carpeta no vacía")**

```bash
npm create vite@latest ferco-loteria-tmp -- --template react-ts
```

Expected: crea `ferco-loteria-tmp/` con el template `react-ts`, sin prompts (la carpeta no existía).

- [ ] **Step 2: Mover el contenido a la raíz, sin pisar el README existente**

```bash
rm ferco-loteria-tmp/README.md
shopt -s dotglob
mv ferco-loteria-tmp/* .
shopt -u dotglob
rmdir ferco-loteria-tmp
```

Expected: `ls` en la raíz muestra ahora `src/`, `public/`, `index.html`, `package.json`, `vite.config.ts`, `.gitignore`, junto con lo que ya había (`docs/`, `README.md`, la imagen del frijol).

- [ ] **Step 3: Instalar dependencias de app y de dev**

```bash
npm install
npm install @supabase/supabase-js react-router-dom qrcode
npm install -D vitest @types/qrcode
```

Expected: `node_modules/` creado, `package.json` con las 3 deps y 2 devDeps agregadas.

- [ ] **Step 4: Agregar config de Vitest y script de test**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

En `package.json`, dentro de `"scripts"`, agregar:

```json
"test": "vitest run"
```

- [ ] **Step 5: Verificar que el scaffold arranca**

```bash
npm run build
```

Expected: build de Vite exitoso (usa el `App.tsx` default del template, todavía no el nuestro).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS, agrega Supabase/router/qrcode/vitest"
git push
```

---

### Task 2: Cliente Supabase y variables de entorno

**Files:**
- Create: `.env` (NO se commitea, ya viene ignorado por el `.gitignore` del template)
- Create: `.env.example`
- Create: `src/lib/supabase.ts`
- Modify: `.gitignore` (verificar que `.env` esté listado)

- [ ] **Step 1: Confirmar que `.env` está en `.gitignore`**

```bash
grep -n "^\.env$" .gitignore || echo ".env" >> .gitignore
```

Expected: `.env` aparece en `.gitignore` (el template de Vite ya lo incluye, este comando lo asegura).

- [ ] **Step 2: Crear `.env` con los valores reales del proyecto Supabase**

Create `.env`:

```
VITE_SUPABASE_URL=https://fcqomskbbyvqhtlgqlai.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_B8UpuoTJ9n2K6BqLG5GfVQ_wGA-Dwij
```

- [ ] **Step 3: Crear `.env.example` (sí se commitea, sin secretos reales)**

Create `.env.example`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 4: Crear el cliente Supabase**

Create `src/lib/supabase.ts`:

```ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en el .env"
  );
}

export const supabase = createClient(url, anonKey);
```

- [ ] **Step 5: Commit**

```bash
git add .env.example .gitignore src/lib/supabase.ts
git commit -m "feat: cliente Supabase y config de entorno"
git push
```

(El archivo `.env` real no se agrega — queda ignorado a propósito.)

---

### Task 3: Imágenes del mazo (16, reales de ferco.com.gt) y ficha de marcado

**Files:**
- Create: `public/images/deck/*.{png,webp,jpg}` (16 archivos)
- Create: `public/images/ficha-frijol.png`

- [ ] **Step 1: Crear la carpeta y descargar las 16 imágenes**

```bash
mkdir -p public/images/deck

curl -L -o "public/images/deck/pisos-ceramicos.png" "https://www.ferco.com.gt/arquivos/slider_category_pisos_gt2.png"
curl -L -o "public/images/deck/pisos-porcelanato.png" "https://www.ferco.com.gt/arquivos/slider_category_pisos2_gt2.png"
curl -L -o "public/images/deck/pisos-blandos.png" "https://www.ferco.com.gt/arquivos/slider_category_pisos_blandos_gt2.png"
curl -L -o "public/images/deck/fachaletas.png" "https://www.ferco.com.gt/arquivos/slider_category_fachadas_gt2.png"
curl -L -o "public/images/deck/azulejos.png" "https://www.ferco.com.gt/arquivos/slider_category_azulejos_gt2.png"
curl -L -o "public/images/deck/griferia-banos.png" "https://www.ferco.com.gt/arquivos/slider_category_grifos_gt2.png"
curl -L -o "public/images/deck/banos.webp" "https://www.ferco.com.gt/arquivos/slider_category_banos_gt2.webp"
curl -L -o "public/images/deck/griferia-cocina.jpg" "https://fercogtm.vtexassets.com/assets/vtex.file-manager-graphql/images/fe77214f-86d1-4453-ae9b-25da4e6e2b83___692325838363583bf616913aef498925.jpg"
curl -L -o "public/images/deck/cocina.jpg" "https://fercogtm.vtexassets.com/assets/vtex.file-manager-graphql/images/48485d78-8182-4ae4-bbd9-79f6999920bf___d3f7a6ad13bd1c9e1de5b508ecacbcec.jpg"
curl -L -o "public/images/deck/muebles-casa.jpg" "https://fercogtm.vtexassets.com/assets/vtex.file-manager-graphql/images/1030b692-ae95-47b4-8baf-768fee579bc7___5a3e637364995383891db29bff459aec.jpg"
curl -L -o "public/images/deck/adhesivos.jpg" "https://fercogtm.vtexassets.com/assets/vtex.file-manager-graphql/images/c0c799d9-8bf6-4c88-a60f-afe1d8cb0456___e418436599a096d11f1d3b6083a333ca.jpg"
curl -L -o "public/images/deck/inspiracion-madera.png" "https://www.ferco.com.gt/arquivos/slider_style_madera_gt.png"
curl -L -o "public/images/deck/cementicios.png" "https://www.ferco.com.gt/arquivos/slider_style_cementicios_gt.png"
curl -L -o "public/images/deck/marmoleado.png" "https://www.ferco.com.gt/arquivos/slider_style_marmoleado_gt.png"
curl -L -o "public/images/deck/decorados.png" "https://www.ferco.com.gt/arquivos/slider_style_decorados_gt.png"
curl -L -o "public/images/deck/piedras.png" "https://www.ferco.com.gt/arquivos/slider_style_piedras_gt.png"

ls public/images/deck | wc -l
```

Expected: `16` archivos listados, todos con tamaño > 0 (`ls -la public/images/deck`).

- [ ] **Step 2: Mover la ficha de marcado (frijol) a `public/`**

```bash
mv "pngwing.com - 2026-08-27T094737.276.png" "public/images/ficha-frijol.png"
```

Expected: el archivo ya no está en la raíz, existe en `public/images/ficha-frijol.png`.

- [ ] **Step 3: Commit**

```bash
git add public/images
git commit -m "feat: agrega las 16 imágenes del mazo y la ficha de marcado"
git push
```

---

### Task 4: Tipos compartidos

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Crear los tipos**

Create `src/types.ts`:

```ts
export type RoomStatus = "waiting" | "playing" | "verifying" | "finished";
export type Pattern = "linea" | "esquinas" | "lleno";

export interface Room {
  id: string;
  code: string;
  country: string | null;
  status: RoomStatus;
  pattern: Pattern;
  drawn_pieces: number[];
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  name: string;
  template_id: number | null;
  confirmed: boolean;
  marks: boolean[];
  shouted_at: string | null;
  joined_at: string;
}

export interface CardTemplate {
  id: number;
  grid: number[];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: tipos de dominio (Room, Player, CardTemplate)"
git push
```

---

### Task 5: Manifest del mazo + generador de plantillas (TDD)

**Files:**
- Create: `src/lib/deck.ts`
- Test: `src/lib/deck.test.ts`

- [ ] **Step 1: Escribir el test que falla**

Create `src/lib/deck.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateTemplates, DECK_IMAGES } from "./deck";

describe("generateTemplates", () => {
  it("devuelve N arreglos únicos de largo 16, permutación de las 16 imágenes", () => {
    const templates = generateTemplates(30);
    expect(templates).toHaveLength(30);

    const keys = new Set(templates.map((t) => t.join(",")));
    expect(keys.size).toBe(30);

    const expectedIndices = DECK_IMAGES.map((_, i) => i);
    for (const grid of templates) {
      expect(grid).toHaveLength(16);
      expect([...grid].sort((a, b) => a - b)).toEqual(expectedIndices);
    }
  });
});
```

- [ ] **Step 2: Correr el test y confirmar que falla**

```bash
npx vitest run src/lib/deck.test.ts
```

Expected: FAIL — `Failed to resolve import "./deck"` (el archivo no existe todavía).

- [ ] **Step 3: Implementar `deck.ts`**

Create `src/lib/deck.ts`:

```ts
export interface DeckImage {
  key: string;
  label: string;
  src: string;
}

export const DECK_IMAGES: DeckImage[] = [
  { key: "pisos-ceramicos", label: "Pisos cerámicos", src: "/images/deck/pisos-ceramicos.png" },
  { key: "pisos-porcelanato", label: "Pisos porcelanato", src: "/images/deck/pisos-porcelanato.png" },
  { key: "pisos-blandos", label: "Pisos Blandos", src: "/images/deck/pisos-blandos.png" },
  { key: "fachaletas", label: "Fachaletas", src: "/images/deck/fachaletas.png" },
  { key: "azulejos", label: "Azulejos", src: "/images/deck/azulejos.png" },
  { key: "griferia-banos", label: "Grifería baños", src: "/images/deck/griferia-banos.png" },
  { key: "banos", label: "Baños", src: "/images/deck/banos.webp" },
  { key: "griferia-cocina", label: "Grifería cocina", src: "/images/deck/griferia-cocina.jpg" },
  { key: "cocina", label: "Cocina", src: "/images/deck/cocina.jpg" },
  { key: "muebles-casa", label: "Muebles de casa", src: "/images/deck/muebles-casa.jpg" },
  { key: "adhesivos", label: "Adhesivos", src: "/images/deck/adhesivos.jpg" },
  { key: "inspiracion-madera", label: "Inspiración madera", src: "/images/deck/inspiracion-madera.png" },
  { key: "cementicios", label: "Cementicios", src: "/images/deck/cementicios.png" },
  { key: "marmoleado", label: "Marmoleado", src: "/images/deck/marmoleado.png" },
  { key: "decorados", label: "Decorados", src: "/images/deck/decorados.png" },
  { key: "piedras", label: "Piedras", src: "/images/deck/piedras.png" },
];

function shuffle(arr: number[], rng: () => number): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateTemplates(
  count: number,
  rng: () => number = Math.random
): number[][] {
  const base = DECK_IMAGES.map((_, i) => i);
  const seen = new Set<string>();
  const templates: number[][] = [];
  while (templates.length < count) {
    const grid = shuffle(base, rng);
    const key = grid.join(",");
    if (!seen.has(key)) {
      seen.add(key);
      templates.push(grid);
    }
  }
  return templates;
}
```

- [ ] **Step 4: Correr el test y confirmar que pasa**

```bash
npx vitest run src/lib/deck.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/lib/deck.ts src/lib/deck.test.ts
git commit -m "feat: manifest de las 16 imágenes y generador de plantillas únicas"
git push
```

---

### Task 6: Lógica de verificación de victoria (TDD)

**Files:**
- Create: `src/lib/checkWin.ts`
- Test: `src/lib/checkWin.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Create `src/lib/checkWin.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { checkWin } from "./checkWin";

const template = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

describe("checkWin", () => {
  it("gana cartón lleno si las 16 fueron llamadas y marcadas", () => {
    const marks = Array(16).fill(true);
    expect(checkWin(template, marks, template, "lleno")).toBe(true);
  });

  it("no gana cartón lleno si falta una marca", () => {
    const marks = Array(16).fill(true);
    marks[5] = false;
    expect(checkWin(template, marks, template, "lleno")).toBe(false);
  });

  it("gana esquinas con las 4 esquinas marcadas y llamadas", () => {
    const marks = Array(16).fill(false);
    [0, 3, 12, 15].forEach((i) => (marks[i] = true));
    expect(checkWin(template, marks, [0, 3, 12, 15], "esquinas")).toBe(true);
  });

  it("gana línea con una fila completa marcada y llamada", () => {
    const marks = Array(16).fill(false);
    [4, 5, 6, 7].forEach((i) => (marks[i] = true));
    expect(checkWin(template, marks, [4, 5, 6, 7], "linea")).toBe(true);
  });

  it("rechaza si hay una marca cuya ficha nunca salió en la tómbola", () => {
    const marks = Array(16).fill(false);
    [0, 3, 12, 15].forEach((i) => (marks[i] = true));
    expect(checkWin(template, marks, [0, 3, 12], "esquinas")).toBe(false);
  });
});
```

- [ ] **Step 2: Correr los tests y confirmar que fallan**

```bash
npx vitest run src/lib/checkWin.test.ts
```

Expected: FAIL — `Failed to resolve import "./checkWin"`.

- [ ] **Step 3: Implementar `checkWin.ts`**

Create `src/lib/checkWin.ts`:

```ts
import type { Pattern } from "../types";

export function checkWin(
  template: number[],
  marks: boolean[],
  drawnPieces: number[],
  pattern: Pattern
): boolean {
  if (template.length !== 16 || marks.length !== 16) {
    throw new Error("template y marks deben tener 16 casillas");
  }

  const drawnSet = new Set(drawnPieces);
  const allMarksWereDrawn = marks.every(
    (marked, i) => !marked || drawnSet.has(template[i])
  );
  if (!allMarksWereDrawn) return false;

  if (pattern === "lleno") return marks.every(Boolean);

  if (pattern === "esquinas") {
    return marks[0] && marks[3] && marks[12] && marks[15];
  }

  const rowWin = [0, 1, 2, 3].some((r) =>
    [0, 1, 2, 3].every((c) => marks[r * 4 + c])
  );
  const colWin = [0, 1, 2, 3].some((c) =>
    [0, 1, 2, 3].every((r) => marks[r * 4 + c])
  );
  return rowWin || colWin;
}
```

- [ ] **Step 4: Correr los tests y confirmar que pasan**

```bash
npx vitest run src/lib/checkWin.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/checkWin.ts src/lib/checkWin.test.ts
git commit -m "feat: checkWin valida patrón ganador y que cada marca haya salido en la tómbola"
git push
```

---

### Task 7: Código de sala

**Files:**
- Create: `src/lib/roomCode.ts`

- [ ] **Step 1: Implementar (trivial, sin test — es una función de 5 líneas sin ramas de lógica)**

Create `src/lib/roomCode.ts`:

```ts
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin O/0/I/1, se confunden

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/roomCode.ts
git commit -m "feat: generador de código de sala de 6 caracteres"
git push
```

---

### Task 8: Esquema Supabase (tablas, RLS, realtime)

**Files:**
- Create: `supabase/migrations/0001_loteria_schema.sql`

- [ ] **Step 1: Escribir la migración**

Create `supabase/migrations/0001_loteria_schema.sql`:

```sql
create table if not exists public.loteria_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  country text,
  status text not null default 'waiting'
    check (status in ('waiting','playing','verifying','finished')),
  pattern text not null default 'lleno'
    check (pattern in ('linea','esquinas','lleno')),
  drawn_pieces int[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.loteria_card_templates (
  id serial primary key,
  grid int[] not null
);

create table if not exists public.loteria_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.loteria_rooms(id) on delete cascade,
  name text not null,
  template_id int references public.loteria_card_templates(id),
  confirmed boolean not null default false,
  marks boolean[] not null default array_fill(false, array[16]),
  shouted_at timestamptz,
  joined_at timestamptz not null default now()
);

alter table public.loteria_rooms enable row level security;
alter table public.loteria_card_templates enable row level security;
alter table public.loteria_players enable row level security;

-- Juego interno de oficina, sin login de usuario: acceso anónimo abierto
-- a estas 3 tablas (no hay datos sensibles, solo nombre + estado de juego).
create policy "loteria anon all rooms" on public.loteria_rooms
  for all using (true) with check (true);
create policy "loteria anon read templates" on public.loteria_card_templates
  for select using (true);
create policy "loteria anon all players" on public.loteria_players
  for all using (true) with check (true);

alter publication supabase_realtime add table public.loteria_rooms;
alter publication supabase_realtime add table public.loteria_players;
```

- [ ] **Step 2: Aplicar la migración**

Usar la tool MCP `mcp__a6cac10a-2564-4d8a-a158-2878e9b36cc1__apply_migration` con:
- `project_id`: `fcqomskbbyvqhtlgqlai`
- `name`: `loteria_schema`
- `query`: el contenido completo del archivo de arriba.

Expected: la tool devuelve éxito. Verificar con `mcp__a6cac10a-2564-4d8a-a158-2878e9b36cc1__list_tables` (project_id `fcqomskbbyvqhtlgqlai`) que aparecen `loteria_rooms`, `loteria_card_templates`, `loteria_players`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_loteria_schema.sql
git commit -m "feat: esquema Supabase para salas, jugadores y plantillas de lotería"
git push
```

---

### Task 9: Sembrar el catálogo de plantillas (~30 cartones únicos)

**Files:**
- Create: `scripts/seed-templates.mjs`
- Create: `supabase/migrations/0002_loteria_templates_seed.sql`

- [ ] **Step 1: Script de generación (JS plano, sin dependencias nuevas — evita agregar `tsx` solo para un script de un solo uso)**

Create `scripts/seed-templates.mjs`:

```js
const IMAGE_COUNT = 16;
const TEMPLATE_COUNT = 30;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const base = Array.from({ length: IMAGE_COUNT }, (_, i) => i);
const seen = new Set();
const templates = [];
while (templates.length < TEMPLATE_COUNT) {
  const grid = shuffle(base);
  const key = grid.join(",");
  if (!seen.has(key)) {
    seen.add(key);
    templates.push(grid);
  }
}

const values = templates
  .map((grid) => `('{${grid.join(",")}}')`)
  .join(",\n  ");

console.log(`insert into public.loteria_card_templates (grid) values\n  ${values};`);
```

- [ ] **Step 2: Generar el SQL de seed**

```bash
node scripts/seed-templates.mjs > supabase/migrations/0002_loteria_templates_seed.sql
cat supabase/migrations/0002_loteria_templates_seed.sql | head -3
```

Expected: el archivo empieza con `insert into public.loteria_card_templates (grid) values` seguido de 30 filas `('{...}')`.

- [ ] **Step 3: Aplicar la migración**

Usar la tool MCP `mcp__a6cac10a-2564-4d8a-a158-2878e9b36cc1__apply_migration` con:
- `project_id`: `fcqomskbbyvqhtlgqlai`
- `name`: `loteria_templates_seed`
- `query`: el contenido completo de `supabase/migrations/0002_loteria_templates_seed.sql`.

Expected: éxito. Verificar contando filas — usar `mcp__a6cac10a-2564-4d8a-a158-2878e9b36cc1__execute_sql` con `select count(*) from public.loteria_card_templates;` → debe devolver `30`.

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-templates.mjs supabase/migrations/0002_loteria_templates_seed.sql
git commit -m "feat: siembra 30 plantillas de cartón únicas"
git push
```

---

### Task 10: Estilos con marca FERCO

**Files:**
- Modify: `src/index.css` (reemplazar contenido completo del template)

- [ ] **Step 1: Reemplazar estilos**

Replace the full content of `src/index.css` with:

```css
:root {
  --ferco-negro: #101820;
  --ferco-amarillo: #f0be1a;
  --ferco-gris: #636569;
  --ferco-verde: #2c3a38;
  --ferco-blanco: #ffffff;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--ferco-negro);
  color: var(--ferco-blanco);
  font-family: "Arial Black", Arial, sans-serif;
}

main {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 40px;
}

header.app-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
}

header.app-header .logo-badge {
  background: var(--ferco-blanco);
  padding: 6px 10px;
  border-radius: 4px;
  display: inline-flex;
}

header.app-header img {
  width: 90px;
  height: auto;
  display: block;
}

h1,
h2 {
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

button {
  background: var(--ferco-amarillo);
  color: var(--ferco-negro);
  border: none;
  font-weight: 900;
  text-transform: uppercase;
  padding: 10px 18px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}

button:disabled {
  background: var(--ferco-gris);
  color: var(--ferco-blanco);
  cursor: not-allowed;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  max-width: 480px;
  margin: 16px 0;
}

.card-cell {
  position: relative;
  aspect-ratio: 1;
  padding: 0;
  border: 2px solid var(--ferco-gris);
  background: var(--ferco-blanco);
  overflow: hidden;
}

.card-cell img:first-child {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-cell .ficha {
  position: absolute;
  inset: 0;
  width: 70%;
  height: 70%;
  margin: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 4px var(--ferco-amarillo));
}

.template-catalog {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
  max-width: 640px;
}

.template-card {
  border: 2px solid var(--ferco-gris);
  background: var(--ferco-verde);
  padding: 4px;
  cursor: pointer;
}

.template-card.selected {
  border-color: var(--ferco-amarillo);
}

.mini-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
}

.mini-grid img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.tombola .last-drawn img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border: 3px solid var(--ferco-amarillo);
}
```

- [ ] **Step 2: Borrar `src/App.css`** (el template la crea pero no la vamos a usar)

```bash
rm -f src/App.css
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "style: tema visual con paleta institucional FERCO"
git push
```

---

### Task 11: Shell de la app, router y header con logo

**Files:**
- Create: `src/components/Header.tsx`
- Modify: `src/main.tsx` (reemplazar contenido completo)
- Modify: `src/App.tsx` (reemplazar contenido completo)
- Modify: `index.html` (título de la pestaña)

- [ ] **Step 1: Header con logo (esquina superior izquierda, sobre fondo blanco — regla de marca)**

Create `src/components/Header.tsx`:

```tsx
export default function Header() {
  return (
    <header className="app-header">
      <span className="logo-badge">
        <img
          src="https://fercogtm.vtexassets.com/arquivos/ferco_logo_gt.png"
          alt="FERCO"
        />
      </span>
    </header>
  );
}
```

- [ ] **Step 2: `main.tsx` con router**

Replace the full content of `src/main.tsx` with:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 3: `App.tsx` con las 4 rutas (placeholders temporales, se completan en las próximas tareas)**

Replace the full content of `src/App.tsx` with:

```tsx
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import PlayerBoard from "./pages/PlayerBoard";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<CreateRoom />} />
        <Route path="/unirse/:code" element={<JoinRoom />} />
        <Route path="/sala/:code" element={<PlayerBoard />} />
        <Route path="/sala/:code/admin" element={<AdminPanel />} />
      </Routes>
    </>
  );
}
```

Nota: esto todavía no compila — `src/pages/*` se crean en las Tareas 12-14. Es esperado, se resuelve dentro de esta misma tarea con placeholders mínimos.

- [ ] **Step 4: Crear placeholders mínimos de página para que compile**

Create `src/pages/CreateRoom.tsx`:

```tsx
export default function CreateRoom() {
  return <main>Crear sala (WIP)</main>;
}
```

Create `src/pages/JoinRoom.tsx`:

```tsx
export default function JoinRoom() {
  return <main>Unirse (WIP)</main>;
}
```

Create `src/pages/PlayerBoard.tsx`:

```tsx
export default function PlayerBoard() {
  return <main>Tablero (WIP)</main>;
}
```

Create `src/pages/AdminPanel.tsx`:

```tsx
export default function AdminPanel() {
  return <main>Admin (WIP)</main>;
}
```

- [ ] **Step 5: Título de la pestaña**

In `index.html`, replace `<title>Vite + React + TS</title>` with:

```html
<title>Lotería FERCO</title>
```

- [ ] **Step 6: Verificar que compila y arranca**

```bash
npm run build
```

Expected: build exitoso, sin errores de TypeScript.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: shell de la app, router de 4 rutas y header con logo FERCO"
git push
```

---

### Task 12: Pantalla `/crear` — admin genera sala + QR

**Files:**
- Modify: `src/pages/CreateRoom.tsx` (reemplazar el placeholder)

- [ ] **Step 1: Implementar**

Replace the full content of `src/pages/CreateRoom.tsx` with:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { supabase } from "../lib/supabase";
import { generateRoomCode } from "../lib/roomCode";

export default function CreateRoom() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [country, setCountry] = useState("GT");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  async function handleCreate() {
    setCreating(true);
    const newCode = generateRoomCode();
    const { error } = await supabase
      .from("loteria_rooms")
      .insert({ code: newCode, country, status: "waiting", pattern: "lleno" });
    setCreating(false);
    if (error) {
      alert("No se pudo crear la sala: " + error.message);
      return;
    }
    const joinUrl = `${window.location.origin}/unirse/${newCode}`;
    setQrDataUrl(await QRCode.toDataURL(joinUrl));
    setCode(newCode);
  }

  return (
    <main>
      <h1>Lotería FERCO — Crear sala</h1>
      <label>
        País{" "}
        <select value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="GT">Guatemala</option>
          <option value="SV">El Salvador</option>
          <option value="HN">Honduras</option>
          <option value="MX">México</option>
        </select>
      </label>
      <p>
        <button onClick={handleCreate} disabled={creating}>
          {creating ? "Creando..." : "Crear sala"}
        </button>
      </p>
      {code && (
        <section>
          <p>
            Código: <strong>{code}</strong>
          </p>
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR para unirse" width={220} height={220} />
          )}
          <p>
            Link: {window.location.origin}/unirse/{code}
          </p>
          <button onClick={() => navigate(`/sala/${code}/admin`)}>
            Ir al panel de admin
          </button>
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verificar manualmente**

```bash
npm run dev
```

Abrir `http://localhost:5173/`, click "Crear sala" → debe mostrar código, QR y link. Confirmar en la tabla `loteria_rooms` (via `execute_sql`: `select * from public.loteria_rooms order by created_at desc limit 1;`) que se insertó la fila.

- [ ] **Step 3: Commit**

```bash
git add src/pages/CreateRoom.tsx
git commit -m "feat: pantalla de admin para crear sala con código y QR"
git push
```

---

### Task 13: Catálogo de cartones + pantalla `/unirse/:code`

**Files:**
- Create: `src/components/TemplateCatalog.tsx`
- Modify: `src/pages/JoinRoom.tsx` (reemplazar el placeholder)

- [ ] **Step 1: Componente de catálogo visual**

Create `src/components/TemplateCatalog.tsx`:

```tsx
import { DECK_IMAGES } from "../lib/deck";
import type { CardTemplate } from "../types";

interface Props {
  templates: CardTemplate[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function TemplateCatalog({ templates, selectedId, onSelect }: Props) {
  return (
    <div className="template-catalog">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          className={t.id === selectedId ? "template-card selected" : "template-card"}
          onClick={() => onSelect(t.id)}
        >
          <div className="mini-grid">
            {t.grid.map((imgIndex, i) => (
              <img key={i} src={DECK_IMAGES[imgIndex].src} alt="" />
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Pantalla de unirse**

Replace the full content of `src/pages/JoinRoom.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import TemplateCatalog from "../components/TemplateCatalog";
import type { CardTemplate, Room } from "../types";

export default function JoinRoom() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [templates, setTemplates] = useState<CardTemplate[]>([]);
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: roomData } = await supabase
        .from("loteria_rooms")
        .select("*")
        .eq("code", code)
        .maybeSingle();
      if (!roomData) {
        setNotFound(true);
        return;
      }
      setRoom(roomData as Room);
      const { data: templateData } = await supabase
        .from("loteria_card_templates")
        .select("*");
      setTemplates((templateData ?? []) as CardTemplate[]);
    }
    load();
  }, [code]);

  async function handleJoin() {
    if (!room || !name.trim() || templates.length === 0) return;
    setJoining(true);
    const templateId =
      selectedId ?? templates[Math.floor(Math.random() * templates.length)].id;
    const { data, error } = await supabase
      .from("loteria_players")
      .insert({
        room_id: room.id,
        name: name.trim(),
        template_id: templateId,
        confirmed: true,
      })
      .select()
      .single();
    setJoining(false);
    if (error || !data) {
      alert("No se pudo unir: " + error?.message);
      return;
    }
    localStorage.setItem(`loteria:${room.code}`, data.id);
    navigate(`/sala/${room.code}`);
  }

  if (notFound) return <main>Sala no encontrada. Revisá el código.</main>;
  if (!room) return <main>Cargando...</main>;

  return (
    <main>
      <h1>Unirse a la sala {room.code}</h1>
      <input
        placeholder="Tu nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <h2>Elegí tu cartón</h2>
      <TemplateCatalog
        templates={templates}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <p>
        <button onClick={handleJoin} disabled={joining || !name.trim()}>
          {selectedId ? "Confirmar cartón" : "Sorpréndeme (aleatorio)"}
        </button>
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Verificar manualmente**

```bash
npm run dev
```

Con una sala ya creada (Tarea 12), abrir `/unirse/<CODIGO>`, poner nombre, elegir un cartón del catálogo, confirmar → debe navegar a `/sala/<CODIGO>`. Verificar en `loteria_players` que la fila se creó con `confirmed = true` y el `template_id` correcto.

- [ ] **Step 4: Commit**

```bash
git add src/components/TemplateCatalog.tsx src/pages/JoinRoom.tsx
git commit -m "feat: catálogo visual de cartones y pantalla de unirse a sala"
git push
```

---

### Task 14: Sync en vivo + tablero del jugador

**Files:**
- Create: `src/hooks/useRoomRealtime.ts`
- Create: `src/components/CardGrid.tsx`
- Modify: `src/pages/PlayerBoard.tsx` (reemplazar el placeholder)

- [ ] **Step 1: Hook de sincronización en vivo**

Create `src/hooks/useRoomRealtime.ts`:

```ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Player, Room } from "../types";

export function useRoomRealtime(roomCode: string | undefined) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    if (!roomCode) return;
    let roomId: string | null = null;

    async function init() {
      const { data: roomData } = await supabase
        .from("loteria_rooms")
        .select("*")
        .eq("code", roomCode)
        .maybeSingle();
      if (!roomData) return;
      roomId = roomData.id;
      setRoom(roomData as Room);

      const { data: playerData } = await supabase
        .from("loteria_players")
        .select("*")
        .eq("room_id", roomId);
      setPlayers((playerData ?? []) as Player[]);
    }
    init();

    const channel = supabase
      .channel(`room:${roomCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "loteria_rooms",
          filter: `code=eq.${roomCode}`,
        },
        (payload) => {
          if (payload.new) setRoom(payload.new as Room);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "loteria_players" },
        (payload) => {
          const incoming = payload.new as Player | undefined;
          if (!incoming || incoming.room_id !== roomId) return;
          setPlayers((prev) => {
            const idx = prev.findIndex((p) => p.id === incoming.id);
            if (idx === -1) return [...prev, incoming];
            const next = [...prev];
            next[idx] = incoming;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  return { room, players };
}
```

Nota (ponytail): el filtro de `loteria_players` es por `room_id` en el cliente, no en el `filter` de Supabase, porque `roomId` todavía no se conoce de forma síncrona cuando se registra el canal. Si esto se vuelve un problema de tráfico con muchas salas simultáneas, se resuelve suscribiendo el canal después de que `init()` resuelve.

- [ ] **Step 2: Grilla 4x4 clicable**

Create `src/components/CardGrid.tsx`:

```tsx
import { DECK_IMAGES } from "../lib/deck";

const FICHA_SRC = "/images/ficha-frijol.png";

interface Props {
  grid: number[];
  marks: boolean[];
  onToggle: (index: number) => void;
}

export default function CardGrid({ grid, marks, onToggle }: Props) {
  return (
    <div className="card-grid">
      {grid.map((imgIndex, i) => (
        <button
          key={i}
          type="button"
          className="card-cell"
          onClick={() => onToggle(i)}
        >
          <img src={DECK_IMAGES[imgIndex].src} alt={DECK_IMAGES[imgIndex].label} />
          {marks[i] && <img className="ficha" src={FICHA_SRC} alt="marcado" />}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Pantalla del jugador**

Replace the full content of `src/pages/PlayerBoard.tsx` with:

```tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useRoomRealtime } from "../hooks/useRoomRealtime";
import CardGrid from "../components/CardGrid";
import type { CardTemplate } from "../types";

export default function PlayerBoard() {
  const { code } = useParams<{ code: string }>();
  const { room, players } = useRoomRealtime(code);
  const [template, setTemplate] = useState<CardTemplate | null>(null);

  const playerId = code ? localStorage.getItem(`loteria:${code}`) : null;
  const me = useMemo(
    () => players.find((p) => p.id === playerId) ?? null,
    [players, playerId]
  );

  useEffect(() => {
    if (!me?.template_id) return;
    supabase
      .from("loteria_card_templates")
      .select("*")
      .eq("id", me.template_id)
      .single()
      .then(({ data }) => setTemplate(data as CardTemplate));
  }, [me?.template_id]);

  async function toggleCell(i: number) {
    if (!me) return;
    const marks = [...me.marks];
    marks[i] = !marks[i];
    await supabase.from("loteria_players").update({ marks }).eq("id", me.id);
  }

  async function shoutLoteria() {
    if (!me) return;
    await supabase
      .from("loteria_players")
      .update({ shouted_at: new Date().toISOString() })
      .eq("id", me.id);
  }

  if (!code || !room) return <main>Cargando sala...</main>;
  if (!me) return <main>No estás en esta sala. Unite desde el link del admin.</main>;
  if (!template) return <main>Cargando tu cartón...</main>;

  return (
    <main>
      <h1>Sala {room.code}</h1>
      <p>Fichas llamadas: {room.drawn_pieces.length} / 16</p>
      <CardGrid grid={template.grid} marks={me.marks} onToggle={toggleCell} />
      <button onClick={shoutLoteria}>¡LOTERÍA!</button>
    </main>
  );
}
```

- [ ] **Step 4: Verificar manualmente**

```bash
npm run build
npm run dev
```

Abrir `/sala/<CODIGO>` en el navegador donde se unió el jugador de prueba (usa el `localStorage` seteado en la Tarea 13) → debe mostrar el tablero 4x4 con sus 16 imágenes. Click en una celda → aparece el frijol; click de nuevo → desaparece. Verificar en `loteria_players.marks` que el array cambia.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRoomRealtime.ts src/components/CardGrid.tsx src/pages/PlayerBoard.tsx
git commit -m "feat: sync en vivo, tablero 4x4 clicable y botón LOTERÍA"
git push
```

---

### Task 15: Panel de admin — tómbola, patrón y verificación

**Files:**
- Create: `src/components/Tombola.tsx`
- Modify: `src/pages/AdminPanel.tsx` (reemplazar el placeholder)

- [ ] **Step 1: Componente de tómbola**

Create `src/components/Tombola.tsx`:

```tsx
import { DECK_IMAGES } from "../lib/deck";

interface Props {
  drawnPieces: number[];
  onDraw: () => void;
  disabled: boolean;
}

export default function Tombola({ drawnPieces, onDraw, disabled }: Props) {
  const last = drawnPieces[drawnPieces.length - 1];
  return (
    <div className="tombola">
      <button onClick={onDraw} disabled={disabled}>
        Sacar ficha ({drawnPieces.length}/{DECK_IMAGES.length})
      </button>
      {last !== undefined && (
        <div className="last-drawn">
          <img src={DECK_IMAGES[last].src} alt={DECK_IMAGES[last].label} />
          <p>{DECK_IMAGES[last].label}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Panel de admin completo**

Replace the full content of `src/pages/AdminPanel.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useRoomRealtime } from "../hooks/useRoomRealtime";
import { supabase } from "../lib/supabase";
import { DECK_IMAGES } from "../lib/deck";
import { checkWin } from "../lib/checkWin";
import Tombola from "../components/Tombola";
import type { CardTemplate, Pattern } from "../types";

export default function AdminPanel() {
  const { code } = useParams<{ code: string }>();
  const { room, players } = useRoomRealtime(code);
  const [templatesById, setTemplatesById] = useState<Record<number, CardTemplate>>({});

  useEffect(() => {
    supabase
      .from("loteria_card_templates")
      .select("*")
      .then(({ data }) => {
        const map: Record<number, CardTemplate> = {};
        for (const t of (data ?? []) as CardTemplate[]) map[t.id] = t;
        setTemplatesById(map);
      });
  }, []);

  if (!room) return <main>Cargando sala...</main>;

  async function setPattern(pattern: Pattern) {
    await supabase.from("loteria_rooms").update({ pattern }).eq("id", room!.id);
  }

  async function startGame() {
    await supabase.from("loteria_rooms").update({ status: "playing" }).eq("id", room!.id);
  }

  async function drawPiece() {
    const remaining = DECK_IMAGES.map((_, i) => i).filter(
      (i) => !room!.drawn_pieces.includes(i)
    );
    if (remaining.length === 0) return;
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    await supabase
      .from("loteria_rooms")
      .update({ drawn_pieces: [...room!.drawn_pieces, next] })
      .eq("id", room!.id);
  }

  async function confirmWin(playerId: string, valid: boolean) {
    if (valid) {
      await supabase.from("loteria_rooms").update({ status: "finished" }).eq("id", room!.id);
    }
    await supabase.from("loteria_players").update({ shouted_at: null }).eq("id", playerId);
  }

  async function resetRoom() {
    await supabase
      .from("loteria_rooms")
      .update({ status: "waiting", drawn_pieces: [] })
      .eq("id", room!.id);
    await supabase
      .from("loteria_players")
      .update({ marks: Array(16).fill(false), shouted_at: null })
      .eq("room_id", room!.id);
  }

  const shouting = players.filter((p) => p.shouted_at);

  return (
    <main>
      <h1>Admin — sala {room.code}</h1>

      <section>
        <h2>Jugadores ({players.length})</h2>
        <ul>
          {players.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Patrón de la ronda</h2>
        {(["linea", "esquinas", "lleno"] as Pattern[]).map((p) => (
          <label key={p} style={{ marginRight: 12 }}>
            <input
              type="radio"
              name="pattern"
              checked={room.pattern === p}
              onChange={() => setPattern(p)}
            />{" "}
            {p}
          </label>
        ))}
      </section>

      {room.status === "waiting" && (
        <p>
          <button onClick={startGame}>Iniciar partida</button>
        </p>
      )}

      {room.status === "playing" && (
        <Tombola
          drawnPieces={room.drawn_pieces}
          onDraw={drawPiece}
          disabled={room.drawn_pieces.length >= DECK_IMAGES.length}
        />
      )}

      {shouting.length > 0 && (
        <section>
          <h2>¡Gritaron lotería!</h2>
          {shouting.map((p) => {
            const template = p.template_id ? templatesById[p.template_id] : null;
            const valid = Boolean(
              template &&
                checkWin(template.grid, p.marks, room.drawn_pieces, room.pattern)
            );
            return (
              <div key={p.id}>
                <p>
                  {p.name}: {valid ? "GANÓ ✅" : "no válido ❌"}
                </p>
                <button onClick={() => confirmWin(p.id, true)}>Confirmar</button>{" "}
                <button onClick={() => confirmWin(p.id, false)}>Rechazar</button>
              </div>
            );
          })}
        </section>
      )}

      <p>
        <button onClick={resetRoom}>Reiniciar partida</button>
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Verificar manualmente el flujo completo**

```bash
npm run build
npm run dev
```

En dos pestañas: una en `/sala/<CODIGO>/admin`, otra en `/sala/<CODIGO>` (jugador de prueba). En el admin: elegir patrón, "Iniciar partida", "Sacar ficha" varias veces → confirmar que la pestaña del jugador ve crecer "Fichas llamadas" en vivo. En el jugador: marcar las celdas correspondientes a las fichas ya llamadas, click "¡LOTERÍA!" → confirmar que aparece en el panel de admin con "GANÓ ✅" o "no válido ❌" según corresponda. Click "Confirmar" y luego "Reiniciar partida" → confirmar que el tablero del jugador vuelve a 0 marcas.

- [ ] **Step 4: Commit**

```bash
git add src/components/Tombola.tsx src/pages/AdminPanel.tsx
git commit -m "feat: panel de admin con tómbola, patrón configurable y verificación de ganador"
git push
```

---

### Task 16: README de uso/deploy y cierre

**Files:**
- Modify: `README.md` (reemplazar contenido)

- [ ] **Step 1: Documentar cómo correr y desplegar**

Replace the full content of `README.md` with:

```markdown
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
```

- [ ] **Step 2: Commit final**

```bash
git add README.md
git commit -m "docs: instrucciones de desarrollo, flujo de juego y deploy"
git push
```

---

## Cobertura del spec

- Stack (Vite/React/Supabase/QR) → Tareas 1, 2, 12.
- 16 imágenes reales FERCO → Tarea 3.
- Modelo de datos → Tareas 8, 9.
- Máquina de estados (waiting/playing/verifying/reinicio) → Tareas 12, 14, 15.
- 4 pantallas → Tareas 12, 13, 14, 15.
- Ficha de marcado (frijol) → Tareas 3, 14.
- Casos borde (código inválido, refresh, admin cierra pestaña, doble grito) →
  cubiertos por `notFound` en JoinRoom, `localStorage` en PlayerBoard, estado
  persistido en Supabase (no en memoria del admin), y el panel de
  verificación itera sobre todos los que gritaron, no solo el primero.
- Verificación (`checkWin` puro + test) → Tarea 6.
