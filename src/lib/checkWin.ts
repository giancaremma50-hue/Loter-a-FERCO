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

  // Una marca solo cuenta si la ficha que cubre realmente salió en la
  // tómbola. Se evalúa por casilla (no se invalida el cartón entero) para
  // que una marca perdida ajena al patrón no rechace una lotería legítima.
  const drawnSet = new Set(drawnPieces);
  const effectiveMarks = marks.map(
    (marked, i) => marked && drawnSet.has(template[i])
  );

  if (pattern === "lleno") return effectiveMarks.every(Boolean);

  if (pattern === "esquinas") {
    return (
      effectiveMarks[0] &&
      effectiveMarks[3] &&
      effectiveMarks[12] &&
      effectiveMarks[15]
    );
  }

  const rowWin = [0, 1, 2, 3].some((r) =>
    [0, 1, 2, 3].every((c) => effectiveMarks[r * 4 + c])
  );
  const colWin = [0, 1, 2, 3].some((c) =>
    [0, 1, 2, 3].every((r) => effectiveMarks[r * 4 + c])
  );
  return rowWin || colWin;
}
