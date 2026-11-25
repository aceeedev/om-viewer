/**
 * Geometry for the Color Profile wheel. SVG user units, centered on (0, 0); angles are in
 * degrees, clockwise from 12 o'clock. Pure functions, no React.
 */

export const WHEEL = {
  /** Width and height of the panel. */
  size: 280,
  /** Corner radius of the 12-sided outline (center of its stroke). */
  outline: 90,
  outlineWidth: 6,
  /** A hue at its minimum sits here; drawn as the dotted ring. */
  minRadius: 18.4,
  /** A hue at its maximum sits here, just inside the outline. */
  maxRadius: 80,
  /** Where each hue's value is printed. */
  label: 111,
  dot: 5.5,
} as const;

const round = (n: number) => Math.round(n * 100) / 100 || 0; // no -0

/** Radius for a setting value: min → minRadius, max → maxRadius, linear between, clamped. */
export function levelRadius(value: number, min: number, max: number): number {
  if (max <= min) return (WHEEL.minRadius + WHEEL.maxRadius) / 2;
  const t = (Math.min(max, Math.max(min, value)) - min) / (max - min);
  return WHEEL.minRadius + t * (WHEEL.maxRadius - WHEEL.minRadius);
}

/** The point at `radius` and `degrees` (clockwise from 12 o'clock). */
export function polar(radius: number, degrees: number): [x: number, y: number] {
  const rad = (degrees * Math.PI) / 180;
  return [round(radius * Math.sin(rad)), round(-radius * Math.cos(rad))];
}

/** Angle of hue `index` out of `count`; the first is at the top. */
export const hueAngle = (index: number, count: number) => (index * 360) / count;

/** SVG `points` attribute for a list of points. */
export const points = (list: [number, number][]) => list.map(([x, y]) => `${x},${y}`).join(" ");

/**
 * One side of the outline, from hue `index`'s corner clockwise to the next, as a filled band
 * `WHEEL.outlineWidth` thick. Bands meet on the corner bisectors, so each side can have its own
 * color and the corners stay sharp. `rotation` (degrees) turns the outline; half a side's angle
 * back centers each side on its index's direction instead of starting there.
 */
export function outlineSide(index: number, count: number, rotation = 0): string {
  const half = WHEEL.outlineWidth / 2 / Math.cos(Math.PI / count);
  const a = hueAngle(index, count) + rotation;
  const b = hueAngle(index + 1, count) + rotation;
  return points([
    polar(WHEEL.outline + half, a),
    polar(WHEEL.outline + half, b),
    polar(WHEEL.outline - half, b),
    polar(WHEEL.outline - half, a),
  ]);
}
