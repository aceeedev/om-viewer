/**
 * The colored inside of the Simple view's color wheels. SVG has no conic gradient, so it's CSS,
 * for a `<div>` in a `<foreignObject>` spanning WHEEL.outline each way from the wheel's center.
 */
import type { CSSProperties } from "react";
import { WHEEL, hueAngle } from "./wheel-geometry";

/** Gray at the middle of a color wheel, where every hue fades out. */
export const CENTER_GRAY = "128 128 128";

/**
 * `colors` evenly around the circle clockwise from the top, each blending into the next, fading
 * to gray toward the middle, and clipped to the polygon through `corners` (wheel units, centered
 * on 0, 0).
 */
export function colorWheelFill(colors: readonly string[], corners: [x: number, y: number][]): CSSProperties {
  const box = WHEEL.outline;
  const clip = corners.map(([x, y]) => `${pct((x + box) / (2 * box))} ${pct((y + box) / (2 * box))}`).join(", ");
  const conic = [...colors, colors[0]].map((color, i) => `${color} ${hueAngle(i, colors.length)}deg`).join(", ");
  return {
    width: "100%",
    height: "100%",
    background:
      `radial-gradient(closest-side, rgb(${CENTER_GRAY}) 20%, rgb(${CENTER_GRAY} / 0.55) 60%, rgb(${CENTER_GRAY} / 0) 100%), ` +
      `conic-gradient(${conic})`,
    clipPath: `polygon(${clip})`,
  };
}

const pct = (t: number) => `${Math.round(t * 10000) / 100}%`;
