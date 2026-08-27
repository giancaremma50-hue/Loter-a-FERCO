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
