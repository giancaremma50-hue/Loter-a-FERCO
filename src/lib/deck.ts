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
