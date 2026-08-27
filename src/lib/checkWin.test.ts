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
