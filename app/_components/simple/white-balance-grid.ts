/**
 * Geometry for the white balance screen's fine-tune box, in screen units (280 wide). Pure
 * functions.
 *
 * As on the camera, amber–blue runs left to right (B on the left, A on the right) and
 * green–magenta top to bottom (G on top, M below), with a lettered tab on each side of the box.
 * At 0, 0 the cursor sits in the middle; at either end of a range it reaches the inner side of
 * that edge.
 */
import type { Ranged, WhiteBalanceFineTune } from "@/lib/recipe";

export const WB_SCREEN = {
  /** The drawing below the screen's heading line. */
  width: 280,
  height: 220,
  /** The box: its outer corner, its size, and the thickness of its colored edges. */
  box: { x: 74, y: 44, size: 132, edge: 3 },
  /** The lettered tabs: G and M above and below the box, B and A beside it. */
  tab: { long: 72, short: 24, side: { long: 80, short: 32 }, gap: 10 },
} as const;

const { box } = WB_SCREEN;
export const BOX_CENTER: [x: number, y: number] = [box.x + box.size / 2, box.y + box.size / 2];
/** How far the cursor travels from the center to either end of a range: 9 units a step on ±7. */
const REACH = box.size / 2 - box.edge;

/** Offset from the center for a value on its range: −REACH at the minimum, REACH at the maximum. */
function offset({ value, min, max }: Ranged): number {
  if (max <= min) return 0;
  const t = (Math.min(Math.max(value, min), max) - min) / (max - min);
  return (2 * t - 1) * REACH;
}

/**
 * The cursor's center: right for amber, left for blue, up for green, down for magenta. Rounded to
 * whole units so the 2-unit crosshair lines stay crisp (on ±7 every step already is one).
 */
export function cursorPosition({ amber, green }: WhiteBalanceFineTune): [x: number, y: number] {
  return [Math.round(BOX_CENTER[0] + offset(amber)), Math.round(BOX_CENTER[1] - offset(green))];
}
