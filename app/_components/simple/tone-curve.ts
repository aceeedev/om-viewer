/**
 * Geometry for the Highlight & Shadow screen: SVG paths in screen units (0..280). Pure functions.
 *
 * Two curves, as on the camera:
 * - Midtones: one arch from corner to corner (a quadratic Bézier), lifted or lowered in the middle.
 * - Shadows & highlights: through the center, the lower half bent by shadows and the upper half by
 *   highlights.
 *
 * These are illustrations of each setting, not the camera's actual tone response. Each step pulls
 * a curve by a fixed amount for small values (matching the design), easing off toward the ±7
 * extremes so every curve keeps rising and stays inside the frame.
 */

export const TONE = {
  /** Width and height of the screen. */
  size: 280,
  /** Where the levels ("Sh −4  Mid ±0  Hi +4") are printed, above the plot. */
  labelY: 27,
  /** The square plot (and its frame), centered across, below the levels. */
  plot: { left: 36, top: 52, size: 208 },
} as const;

const PLOT = TONE.plot.size;

/** Midtones move the arch's control point by this fraction of the plot per step... */
const MID_STEP = 0.184;
/** ...up to this; beyond it the curve would overshoot the corner. */
const MID_LIMIT = 0.5;
/** Shadows and highlights move their half's control point by this much per step, up to the limit. */
const END_STEP = 0.064;
const END_LIMIT = 0.25;

/** How far `steps` moves a control point: linear near 0, approaching `limit` at the extremes. */
export function pull(steps: number, perStep: number, limit: number): number {
  return limit * Math.tanh((steps * perStep) / limit);
}

const round = (n: number) => Math.round(n * 100) / 100 || 0;
/** Screen x for input level `x` (0 = black, 1 = white). */
const px = (x: number) => round(TONE.plot.left + x * PLOT);
/** Screen y for output level `y`. */
const py = (y: number) => round(TONE.plot.top + (1 - y) * PLOT);
const pt = (x: number, y: number) => `${px(x)} ${py(y)}`;

/** The midtone arch. */
export function midtoneCurve(midtones: number): string {
  const lift = pull(midtones, MID_STEP, MID_LIMIT);
  return `M${pt(0, 0)}Q${pt(0.5, 0.5 + lift)} ${pt(1, 1)}`;
}

/** The shadow/highlight curve: two halves meeting at the center. */
export function shadowHighlightCurve(shadows: number, highlights: number): string {
  const s = pull(shadows, END_STEP, END_LIMIT);
  const h = pull(highlights, END_STEP, END_LIMIT);
  return `M${pt(0, 0)}Q${pt(0.25, 0.25 + s)} ${pt(0.5, 0.5)}Q${pt(0.75, 0.75 + h)} ${pt(1, 1)}`;
}
