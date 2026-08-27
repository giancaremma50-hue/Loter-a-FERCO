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
  { key: "griferia-home", label: "Grifo lavamanos", src: "/images/deck/griferia-home.jpg" },
  { key: "ducha-city", label: "Ducha City", src: "/images/deck/ducha-city.jpg" },
  { key: "inodoro-misty", label: "Inodoro Misty", src: "/images/deck/inodoro-misty.jpg" },
  { key: "grifo-pedal", label: "Grifo institucional", src: "/images/deck/grifo-pedal.jpg" },
  { key: "grifo-oro", label: "Grifo oro cepillado", src: "/images/deck/grifo-oro.jpg" },
  { key: "grifo-piazza", label: "Grifo Piazza", src: "/images/deck/grifo-piazza.jpg" },
  { key: "grifo-indus", label: "Grifo Indus negro", src: "/images/deck/grifo-indus.jpg" },
  { key: "asiento-inodoro", label: "Asiento de inodoro", src: "/images/deck/asiento-inodoro.jpg" },
];

export const CARD_SLOTS = 16;

function shuffle(arr: number[], rng: () => number): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Cada plantilla es una selección de CARD_SLOTS imágenes distintas tomadas
 * del mazo completo (no todas las plantillas contienen las mismas imágenes).
 * Esto evita que, al sacar suficientes fichas, todos los cartones ganen a
 * la vez: dos cartones solo comparten el mismo patrón ganador por
 * coincidencia real, no porque el mazo entero quepa en cada cartón.
 */
export function generateTemplates(
  count: number,
  rng: () => number = Math.random
): number[][] {
  const poolSize = DECK_IMAGES.length;
  const pool = DECK_IMAGES.map((_, i) => i);
  const seen = new Set<string>();
  const templates: number[][] = [];
  while (templates.length < count) {
    const grid = shuffle(pool, rng).slice(0, Math.min(CARD_SLOTS, poolSize));
    const key = grid.join(",");
    if (!seen.has(key)) {
      seen.add(key);
      templates.push(grid);
    }
  }
  return templates;
}
