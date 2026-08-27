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
