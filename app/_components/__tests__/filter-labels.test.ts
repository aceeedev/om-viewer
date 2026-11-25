import { describe, expect, it } from "vitest";
import { EDGE_GAP, GAP, HALF_HEIGHT, clearance, labelCenter } from "../simple/filter-labels";
import { FILTERS } from "../simple/filter-wheel";
import { WHEEL } from "../simple/wheel-geometry";

const boxes = FILTERS.map((f, i) => {
  const [x, y] = labelCenter(i, f.width);
  return { name: f.name, x, y, half: f.width / 2 };
});

describe("filter name placement", () => {
  it("keeps every name clear of the octagon and inside the panel", () => {
    const limit = WHEEL.size / 2 - EDGE_GAP;
    for (const b of boxes) {
      expect(clearance(b.x, b.y, b.half), b.name).toBeGreaterThanOrEqual(GAP);
      expect(Math.abs(b.x) + b.half, b.name).toBeLessThanOrEqual(limit + 0.01);
      expect(Math.abs(b.y) + HALF_HEIGHT, b.name).toBeLessThanOrEqual(limit + 0.01);
    }
  });

  it("puts names that fit at the hue wheel's label distance", () => {
    for (const name of ["Yellow", "Red", "Blue", "Cyan"]) {
      const b = boxes.find((x) => x.name === name)!;
      expect(Math.hypot(b.x, b.y), name).toBeCloseTo(WHEEL.label, 1);
    }
  });

  it("slides Yellow-green up into its corner instead of off the panel", () => {
    const yg = boxes.find((b) => b.name === "Yellow-green")!;
    expect(yg.x).toBeLessThan(0);
    expect(-yg.y).toBeGreaterThan(-yg.x); // above the diagonal
  });

  it("never overlaps two names", () => {
    for (const a of boxes) {
      for (const b of boxes) {
        if (a === b) continue;
        const apartX = Math.abs(a.x - b.x) >= a.half + b.half;
        const apartY = Math.abs(a.y - b.y) >= 2 * HALF_HEIGHT;
        expect(apartX || apartY, `${a.name} / ${b.name}`).toBe(true);
      }
    }
  });

  it("measures overlap as negative clearance", () => {
    expect(clearance(0, 0, 10)).toBeLessThan(0); // the middle of the wheel
    expect(clearance(0, -111, 23)).toBeGreaterThan(GAP); // Yellow's spot
  });
});
