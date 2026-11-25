import { describe, expect, it } from "vitest";
import { TONE, midtoneCurve, shadowHighlightCurve } from "../simple/tone-curve";

const PLOT = TONE.plot.size;
/** Numbers in a path, as [x, y] pairs. */
const pairs = (d: string) => {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return n.flatMap((_, i) => (i % 2 ? [] : [[n[i], n[i + 1]] as [number, number]]));
};
/** Output level (0..1) for a panel y. */
const level = (y: number) => (TONE.plot.top + PLOT - y) / PLOT;

describe("tone curve", () => {
  it("is the diagonal when every level is 0", () => {
    expect(midtoneCurve(0)).toBe("M36 260Q140 156 244 52");
    expect(shadowHighlightCurve(0, 0)).toBe("M36 260Q88 208 140 156Q192 104 244 52");
  });

  it("bends like the design for small values (within 2px)", () => {
    // Measured from the design at Sh −1, Mid +1, Hi −2: the midtone arch peaks 0.088 above the
    // diagonal at the center, the shadow half dips 0.029 at a quarter, the highlight half 0.062.
    // A quadratic Bézier's peak offset is half its control point's.
    const [, mid] = pairs(midtoneCurve(1));
    expect(((level(mid[1]) - 0.5) / 2) * PLOT).toBeCloseTo(0.088 * PLOT, -0.6);
    const [, sh, , hi] = pairs(shadowHighlightCurve(-1, -2));
    expect(((level(sh[1]) - 0.25) / 2) * PLOT).toBeCloseTo(-0.029 * PLOT, -0.6);
    expect(((level(hi[1]) - 0.75) / 2) * PLOT).toBeCloseTo(-0.062 * PLOT, -0.6);
  });

  it("keeps rising and stays inside the frame at the ±7 extremes", () => {
    for (const v of [-7, 7]) {
      // A quadratic Bézier rises throughout when its control point's level lies between its ends'.
      const [, c] = pairs(midtoneCurve(v));
      expect(level(c[1])).toBeGreaterThan(0);
      expect(level(c[1])).toBeLessThan(1);
      const [, s, , h] = pairs(shadowHighlightCurve(v, v));
      expect(level(s[1])).toBeGreaterThan(0);
      expect(level(s[1])).toBeLessThan(0.5);
      expect(level(h[1])).toBeGreaterThan(0.5);
      expect(level(h[1])).toBeLessThan(1);
    }
    // Each step still moves the curve, even near the extremes.
    expect(midtoneCurve(7)).not.toBe(midtoneCurve(6));
  });
});
