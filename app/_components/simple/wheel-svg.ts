/**
 * The Simple view's Color Profile wheel (see hue-wheel.tsx) as a standalone SVG document, for the
 * images drawn outside the page: the social preview image and the site's icons. Pure functions,
 * no React.
 */
import { COLOR_PROFILE_HUES } from "@/lib/recipe/tags";
import { HUE_SWATCHES } from "../sections";
import { CENTER_GRAY } from "./wheel-fill";
import { WHEEL, hueAngle, levelRadius, outlineSide, points, polar } from "./wheel-geometry";

export interface WheelSvgOptions {
  /** The range the values sit in: −5 to +5 for Color Profile. */
  min: number;
  max: number;
  /** The spokes, the minimum ring around the gray middle, and the ring at 0. Default true. */
  grid?: boolean;
  /** The colors fading to gray toward the middle. Default true. */
  fade?: boolean;
  /** A dot at each hue's value. Default true. */
  dots?: boolean;
  /** Thickness of the 12-sided outline, in wheel units. Default WHEEL.outlineWidth. */
  outlineWidth?: number;
  /** Thickness of the white line around the values' shape. Default 2. */
  shapeWidth?: number;
}

/**
 * The wheel with a shape for `values` (one per Color Profile hue, in the camera's order), as SVG
 * markup sized to the outline plus a little margin, with no value labels around it. The view's
 * colored fill is a CSS conic gradient, which SVG doesn't have, so here it's 12 wedges, each
 * shading from its hue to the next, under the same gray fade toward the middle.
 */
export function colorWheelSvg(
  values: readonly number[],
  { min, max, grid = true, fade = true, dots = true, outlineWidth = WHEEL.outlineWidth, shapeWidth = 2 }: WheelSvgOptions,
): string {
  const colors = COLOR_PROFILE_HUES.map((hue) => HUE_SWATCHES[hue]);
  const count = colors.length;
  if (values.length !== count) throw new Error(`Expected ${count} hue values, got ${values.length}`);

  const at = (radius: number, i: number) => polar(radius, hueAngle(i, count));
  const ring = (radius: number) => points(colors.map((_, i) => at(radius, i)));
  const marks = values.map((value, i) => at(levelRadius(value, min, max), i));
  const shape = points(marks);
  const outline = ring(WHEEL.outline);
  const r = WHEEL.outline + outlineWidth;

  // One gradient per side, from its hue to the next: shades both the wedge and the outline's side.
  const gradients = colors.map((color, i) => {
    const [x1, y1] = at(WHEEL.outline, i);
    const [x2, y2] = at(WHEEL.outline, i + 1);
    return (
      `<linearGradient id="side-${i}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
      `<stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${colors[(i + 1) % count]}"/>` +
      `</linearGradient>`
    );
  });
  const wedges = colors.map(
    (_, i) => `<polygon points="${points([[0, 0], at(WHEEL.outline, i), at(WHEEL.outline, i + 1)])}" fill="url(#side-${i})"/>`,
  );
  const spokes = colors.map((_, i) => {
    const [x1, y1] = at(WHEEL.minRadius, i);
    const [x2, y2] = at(WHEEL.outline, i);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-opacity="0.14"/>`;
  });
  const sides = colors.map(
    (_, i) => `<polygon points="${outlineSide(i, count, 0, outlineWidth)}" fill="url(#side-${i})"/>`,
  );
  const dotMarks = marks.map(
    ([x, y], i) =>
      `<circle cx="${x}" cy="${y}" r="${WHEEL.dot}" fill="${colors[i]}" stroke="white" stroke-opacity="0.85" stroke-width="1.25"/>`,
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-r} ${-r} ${2 * r} ${2 * r}">` +
    `<defs>${gradients.join("")}` +
    // The fade to gray toward the middle, as in colorWheelFill.
    (fade
      ? `<radialGradient id="fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${WHEEL.outline}">` +
        `<stop offset="0.2" stop-color="rgb(${CENTER_GRAY})"/>` +
        `<stop offset="0.6" stop-color="rgb(${CENTER_GRAY})" stop-opacity="0.55"/>` +
        `<stop offset="1" stop-color="rgb(${CENTER_GRAY})" stop-opacity="0"/>` +
        `</radialGradient>`
      : "") +
    `</defs>` +
    `<g>` +
    wedges.join("") +
    (fade ? `<polygon points="${outline}" fill="url(#fade)"/>` : "") +
    // Dim the wheel outside the values' shape and light it inside.
    `<path d="M${outline}Z M${shape}Z" fill="black" fill-opacity="0.5" fill-rule="evenodd"/>` +
    `<polygon points="${shape}" fill="white" fill-opacity="0.38"/>` +
    (grid
      ? `<g stroke="white" stroke-width="1" fill="none">${spokes.join("")}` +
        `<polygon points="${ring(WHEEL.minRadius)}" fill="rgb(${CENTER_GRAY})" fill-opacity="0.35" stroke-opacity="0.5"/>` +
        `<polygon points="${ring(levelRadius(0, min, max))}" stroke-opacity="0.5"/></g>`
      : "") +
    `<polygon points="${shape}" fill="none" stroke="white" stroke-width="${shapeWidth}" stroke-linejoin="round"/>` +
    sides.join("") +
    (dots ? dotMarks.join("") : "") +
    `</g></svg>`
  );
}
