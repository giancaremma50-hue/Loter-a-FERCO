import { describe, it, expect } from "vitest";
import { generateTemplates, DECK_IMAGES, CARD_SLOTS } from "./deck";

describe("generateTemplates", () => {
  it("devuelve N arreglos únicos de largo 16, cada uno con imágenes distintas del mazo", () => {
    const templates = generateTemplates(30);
    expect(templates).toHaveLength(30);

    const keys = new Set(templates.map((t) => t.join(",")));
    expect(keys.size).toBe(30);

    for (const grid of templates) {
      expect(grid).toHaveLength(CARD_SLOTS);
      const uniqueInGrid = new Set(grid);
      expect(uniqueInGrid.size).toBe(CARD_SLOTS);
      for (const imgIndex of grid) {
        expect(imgIndex).toBeGreaterThanOrEqual(0);
        expect(imgIndex).toBeLessThan(DECK_IMAGES.length);
      }
    }
  });

  it("dos plantillas no son idénticas en contenido (no todas comparten el mismo mazo completo)", () => {
    const templates = generateTemplates(10);
    const setsAsSortedKeys = templates.map((t) => [...t].sort((a, b) => a - b).join(","));
    const uniqueSets = new Set(setsAsSortedKeys);
    // Con 24 imágenes y 16 casillas, es esperable que al menos algunas
    // plantillas tengan un conjunto de imágenes distinto entre sí.
    expect(uniqueSets.size).toBeGreaterThan(1);
  });
});
