/**
 * The colored inside of the Simple view's color wheels. SVG has no conic gradient, so it's CSS,
 * on a `<div>` laid under the wheel's `<svg>` (which must then be transparent and positioned, so
 * it paints on top). Not a `<foreignObject>` inside the SVG: WebKit (every iOS browser) ignores
 * the SVG's viewBox scaling and transforms for clipped HTML in one, and draws it in the wrong
 * place at the wrong size.
 */
import type { CSSProperties } from "react";
import { WHEEL, hueAngle } from "./wheel-geometry";

/** Gray at the middle of a color wheel, where every hue fades out. */
export const CENTER_GRAY = "128 128 128";

/**
 * `colors` evenly around the circle clockwise from the top, each blending into the next, fading
 * to gray toward the middle, and clipped to the polygon through `corners` (wheel units, centered
 * on 0, 0). Positioned absolutely over a WHEEL.size square screen, around `center` (SVG units).
 */
export function colorWheelFill(
  colors: readonly string[],
  corners: [x: number, y: number][],
  center: [x: number, y: number] = [WHEEL.size / 2, WHEEL.size / 2],
): CSSProperties {
  const box = WHEEL.outline;
  const clip = corners.map(([x, y]) => `${pct((x + box) / (2 * box))} ${pct((y + box) / (2 * box))}`).join(", ");
  const conic = [...colors, colors[0]].map((color, i) => `${color} ${hueAngle(i, colors.length)}deg`).join(", ");
  return {
    position: "absolute",
    left: pct((center[0] - box) / WHEEL.size),
    top: pct((center[1] - box) / WHEEL.size),
    width: pct((2 * box) / WHEEL.size),
    height: pct((2 * box) / WHEEL.size),
    background:
      `radial-gradient(closest-side, rgb(${CENTER_GRAY}) 20%, rgb(${CENTER_GRAY} / 0.55) 60%, rgb(${CENTER_GRAY} / 0) 100%), ` +
      `conic-gradient(${conic})`,
    clipPath: `polygon(${clip})`,
  };
}

const pct = (t: number) => `${Math.round(t * 10000) / 100}%`;
