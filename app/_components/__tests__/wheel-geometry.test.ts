import { describe, expect, it } from "vitest";
import { WHEEL, hueAngle, levelRadius, outlineSide, points, polar } from "../simple/wheel-geometry";

describe("wheel geometry", () => {
  it("maps a setting's range onto the wheel's radii", () => {
    expect(levelRadius(-5, -5, 5)).toBe(WHEEL.minRadius);
    expect(levelRadius(5, -5, 5)).toBe(WHEEL.maxRadius);
    expect(levelRadius(0, -5, 5)).toBeCloseTo(49.2); // the solid 0 ring
    expect(levelRadius(1, -5, 5) - levelRadius(0, -5, 5)).toBeCloseTo(6.16, 2);
    expect(levelRadius(9, -5, 5)).toBe(WHEEL.maxRadius); // clamped
    expect(levelRadius(1, 1, 1)).toBe((WHEEL.minRadius + WHEEL.maxRadius) / 2); // empty range
  });

  it("measures angles clockwise from 12 o'clock, first hue at the top", () => {
    expect(polar(10, 0)).toEqual([0, -10]);
    expect(polar(10, 90)).toEqual([10, 0]);
    expect(polar(10, 180)).toEqual([0, 10]);
    expect(hueAngle(0, 12)).toBe(0);
    expect(hueAngle(3, 12)).toBe(90);
  });

  it("draws each side of the outline as a band between two corners", () => {
    const half = WHEEL.outlineWidth / 2 / Math.cos(Math.PI / 12);
    const corner = (r: number, deg: number) => polar(r, deg);
    expect(outlineSide(0, 12)).toBe(
      points([
        corner(WHEEL.outline + half, 0),
        corner(WHEEL.outline + half, 30),
        corner(WHEEL.outline - half, 30),
        corner(WHEEL.outline - half, 0),
      ]),
    );
    // Midway along a side, the band is exactly outlineWidth thick.
    const [ox, oy] = polar(WHEEL.outline + half, 0);
    const [px, py] = polar(WHEEL.outline + half, 30);
    const [ix, iy] = polar(WHEEL.outline - half, 0);
    const [jx, jy] = polar(WHEEL.outline - half, 30);
    const outerMid = Math.hypot((ox + px) / 2, (oy + py) / 2);
    const innerMid = Math.hypot((ix + jx) / 2, (iy + jy) / 2);
    expect(outerMid - innerMid).toBeCloseTo(WHEEL.outlineWidth, 1);
  });

  it("centers each side on its direction when turned back half a side", () => {
    // The filter wheel: eight sides, the first (Yellow) straddling 12 o'clock.
    const side = (i: number) => outlineSide(i, 8, -22.5).split(" ").map((p) => p.split(",").map(Number));
    const [[ax, ay], [bx, by]] = side(0);
    expect(ax).toBeCloseTo(-bx, 2);
    expect(ay).toBeCloseTo(by, 2);
    // The third side (Red) straddles 3 o'clock.
    const [[cx, cy], [dx, dy]] = side(2);
    expect(cx).toBeCloseTo(dx, 2);
    expect(cy).toBeCloseTo(-dy, 2);
  });

  it("draws a bolder outline when given a width", () => {
    expect(outlineSide(0, 12, 0, WHEEL.outlineWidth)).toBe(outlineSide(0, 12));
    const thickness = (width: number) => {
      const [[ox, oy], [px, py], [jx, jy], [ix, iy]] = outlineSide(0, 12, 0, width)
        .split(" ")
        .map((p) => p.split(",").map(Number));
      return Math.hypot((ox + px) / 2, (oy + py) / 2) - Math.hypot((ix + jx) / 2, (iy + jy) / 2);
    };
    expect(thickness(14)).toBeCloseTo(14, 1);
  });
});
