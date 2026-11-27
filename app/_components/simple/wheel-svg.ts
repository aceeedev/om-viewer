/**
 * The Simple view's Color Profile wheel (see hue-wheel.tsx) as a standalone SVG document, for the
 * images drawn outside the page: the social preview image and the site's icons. Pure functions,
 * no React.
 */
import { COLOR_PROFILE_HUES } from "@/lib/recipe/tags";
import { HUE_SWATCHES } from "../sections";
import { CENTER_GRAY } from "./wheel-fill";
import { WHEEL, hueAngle, levelRadius, outlineSide, points, polar } from "./wheel-geometry";

/** The camera-style screens' near-black: --color-screen in globals.css. */
export const SCREEN_COLOR = "#0b0b0d";

/** Color Profile Control's range for each hue. */
export const COLOR_PROFILE_RANGE = { min: -5, max: 5 };

/**
 * An example Color Profile for the site's own images (the social preview image and the icon), so
 * the wheel has a shape: a value for each hue, in the camera's order.
 */
export const EXAMPLE_VALUES: readonly number[] = [2, 3, 1, 0, -2, -1, 1, 3, 4, 1, -1, 2];

/** How many thin wedges make up each hue's share of the colored fill. */
const SLICES = 6;

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
  /**
   * A camera-style screen behind the wheel: a SCREEN_COLOR square reaching `padding` past the
   * wheel's margin, with corners rounded to `radius` (both in wheel units). Default none.
   */
  screen?: { padding: number; radius: number };
}

/**
 * The wheel with a shape for `values` (one per Color Profile hue, in the camera's order), as SVG
 * markup sized to the outline plus a little margin, with no value labels around it. The view's
 * colored fill is a CSS conic gradient, which SVG doesn't have, so here it's thin wedges, shading
 * from each hue to the next, under the same gray fade toward the middle.
 */
export function colorWheelSvg(
  values: readonly number[],
  {
    min,
    max,
    grid = true,
    fade = true,
    dots = true,
    outlineWidth = WHEEL.outlineWidth,
    shapeWidth = 2,
    screen,
  }: WheelSvgOptions,
): string {
  const colors = COLOR_PROFILE_HUES.map((hue) => HUE_SWATCHES[hue]);
  const count = colors.length;
  if (values.length !== count) throw new Error(`Expected ${count} hue values, got ${values.length}`);

  const at = (radius: number, i: number) => polar(radius, hueAngle(i, count));
  const ring = (radius: number) => points(colors.map((_, i) => at(radius, i)));
  const marks = values.map((value, i) => at(levelRadius(value, min, max), i));
  const shape = points(marks);
  const outline = ring(WHEEL.outline);
  const r = WHEEL.outline + outlineWidth + (screen?.padding ?? 0);

  // One gradient per side of the outline, from its hue to the next.
  const gradients = colors.map((color, i) => {
    const [x1, y1] = at(WHEEL.outline, i);
    const [x2, y2] = at(WHEEL.outline, i + 1);
    return (
      `<linearGradient id="side-${i}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
      `<stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="${colors[(i + 1) % count]}"/>` +
      `</linearGradient>`
    );
  });

  // The colored fill: each hue's share split into SLICES thin wedges, each with its own short
  // gradient. One gradient across a whole share can't run along both its edges, so with only 12
  // the colors don't meet in the middle and the wheel looks faceted. Along the outline the slices'
  // gradients add up to the side's, so the fill meets the outline seamlessly.
  const fillGradients: string[] = [];
  const wedges: string[] = [];
  colors.forEach((color, i) => {
    const next = colors[(i + 1) % count];
    const [a, b] = [at(WHEEL.outline, i), at(WHEEL.outline, i + 1)];
    const along = (t: number): [number, number] => [round(a[0] + (b[0] - a[0]) * t), round(a[1] + (b[1] - a[1]) * t)];
    for (let j = 0; j < SLICES; j++) {
      const [[x1, y1], [x2, y2]] = [along(j / SLICES), along((j + 1) / SLICES)];
      const id = `fill-${i}-${j}`;
      fillGradients.push(
        `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
          `<stop offset="0" stop-color="${mix(color, next, j / SLICES)}"/>` +
          `<stop offset="1" stop-color="${mix(color, next, (j + 1) / SLICES)}"/></linearGradient>`,
      );
      // Stroked in its own gradient too, which covers the hairline seams anti-aliasing leaves between slices.
      wedges.push(`<polygon points="${points([[0, 0], [x1, y1], [x2, y2]])}" fill="url(#${id})" stroke="url(#${id})"/>`);
    }
  });
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
    `<defs>${gradients.join("")}${fillGradients.join("")}` +
    // The fade to gray toward the middle, as in colorWheelFill.
    (fade
      ? `<radialGradient id="fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${WHEEL.outline}">` +
        `<stop offset="0.2" stop-color="rgb(${CENTER_GRAY})"/>` +
        `<stop offset="0.6" stop-color="rgb(${CENTER_GRAY})" stop-opacity="0.55"/>` +
        `<stop offset="1" stop-color="rgb(${CENTER_GRAY})" stop-opacity="0"/>` +
        `</radialGradient>`
      : "") +
    `</defs>` +
    (screen
      ? `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" rx="${screen.radius}" fill="${SCREEN_COLOR}"/>`
      : "") +
    `<g>` +
    `<g stroke-width="0.75">${wedges.join("")}</g>` +
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

const round = (n: number) => Math.round(n * 100) / 100 || 0; // no -0

/** The color `t` of the way from `a` to `b` (both #rrggbb), mixed in sRGB as SVG gradients mix them. */
function mix(a: string, b: string, t: number): string {
  const channel = (color: string, i: number) => parseInt(color.slice(1 + 2 * i, 3 + 2 * i), 16);
  return (
    "#" +
    [0, 1, 2]
      .map((i) => Math.round(channel(a, i) + (channel(b, i) - channel(a, i)) * t).toString(16).padStart(2, "0"))
      .join("")
  );
}
