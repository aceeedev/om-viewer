/**
 * Colors for Color Creator's hue ring. Pure functions, no React.
 *
 * The camera sets the hue in 30 steps (stored 0–29) and the saturation in 8 (−4 to +3). The
 * steps go once around the color circle, but which color step 0 is hasn't been confirmed, so the
 * ring follows the other wheels: step 0 is yellow at the top, then clockwise through red, blue
 * and green, in the hue wheel's palette.
 */
import { HUE_SWATCHES } from "../sections";

/** Shown as a footnote wherever the ring's colors are drawn. */
export const HUE_STEPS_UNVERIFIED =
  "which color each of the 30 steps is hasn't been confirmed. The ring assumes step 0 is yellow, " +
  "at the top, with the steps going clockwise through red, blue and green like the other wheels.";

/** The Color Profile hues' colors in the camera's order, clockwise from yellow. */
export const PALETTE: readonly string[] = Object.values(HUE_SWATCHES);

/**
 * The color of hue step `step` out of `steps`, as "#rrggbb": the palette's colors spread evenly
 * around the ring, the steps between them mixed in sRGB (as a CSS gradient through the same
 * colors blends them), so each step matches the wheel's fill behind it.
 */
export function hueStepColor(step: number, steps: number): string {
  const n = PALETTE.length;
  const position = ((((step * n) / steps) % n) + n) % n;
  const i = Math.floor(position);
  return mix(PALETTE[i], PALETTE[(i + 1) % n], position - i);
}

/** `a` and `b` ("#rrggbb") mixed: `t` 0 is all `a`, 1 all `b`. */
function mix(a: string, b: string, t: number): string {
  const channel = (hex: string, k: number) => parseInt(hex.slice(1 + 2 * k, 3 + 2 * k), 16);
  return `#${[0, 1, 2]
    .map((k) => Math.round(channel(a, k) + (channel(b, k) - channel(a, k)) * t))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}
