/**
 * Where the filter wheel prints each filter's name, in the wheel's units (centered on 0, 0).
 * Pure functions.
 *
 * Names sit on their filter's direction, as far out as the hue wheel's values when they fit
 * there. A long name moves outward until it clears the octagon, staying inside the panel: in a
 * diagonal corner that means sliding along the panel's edge ("Yellow-green" moves up).
 */
import { WHEEL, polar } from "./wheel-geometry";

const SIDES = 8;
/** Outer edge of the octagon's colored band, from the center to the middle of a side. */
const BAND_EDGE = WHEEL.outline * Math.cos(Math.PI / SIDES) + WHEEL.outlineWidth / 2;
/** Space kept between a name and the band... */
export const GAP = 5;
/** ...and between a name and the panel's edge. */
export const EDGE_GAP = 4;
/** Half the height of a 15px name's letters. */
export const HALF_HEIGHT = 7;

const LIMIT = WHEEL.size / 2 - EDGE_GAP;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round = (n: number) => Math.round(n * 100) / 100 || 0;

/**
 * Distance from the octagon's band to a name's box (negative when they overlap): the octagon is
 * convex and shares the box's axes, so the box clears it when some side's outward normal has
 * every corner beyond that side.
 */
export function clearance(x: number, y: number, halfWidth: number): number {
  const corners = [-1, 1].flatMap((sx) => [-1, 1].map((sy) => [x + sx * halfWidth, y + sy * HALF_HEIGHT]));
  let best = -Infinity;
  for (let k = 0; k < SIDES; k++) {
    const a = (k * 2 * Math.PI) / SIDES;
    const [nx, ny] = [Math.sin(a), -Math.cos(a)];
    const nearest = Math.min(...corners.map(([cx, cy]) => cx * nx + cy * ny));
    best = Math.max(best, nearest - BAND_EDGE);
  }
  return best;
}

/** Center of filter `index`'s name, given the name's width. */
export function labelCenter(index: number, width: number): [x: number, y: number] {
  const angle = (index * 360) / SIDES;
  const half = width / 2;
  for (let r = WHEEL.label; r <= WHEEL.size; r += 0.5) {
    const [px, py] = polar(r, angle);
    const x = clamp(px, -LIMIT + half, LIMIT - half);
    const y = clamp(py, -LIMIT + HALF_HEIGHT, LIMIT - HALF_HEIGHT);
    if (clearance(x, y, half) >= GAP) return [round(x), round(y)];
  }
  return polar(WHEEL.label, angle);
}
