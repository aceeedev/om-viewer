import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { COLOR_PROFILE_HUES } from "@/lib/recipe/tags";
import { SITE_NAME, SOCIAL_IMAGE } from "@/lib/site";
import { HUE_SWATCHES } from "./_components/sections";
import { CENTER_GRAY } from "./_components/simple/wheel-fill";
import { WHEEL, hueAngle, levelRadius, outlineSide, points, polar } from "./_components/simple/wheel-geometry";

/**
 * The social preview image, shown when a link to the site is shared. Drawn at build time in the site's
 * style: the black header bar, the headline in wide Archivo, and a Color Profile wheel on a camera-style
 * screen. Every page lists it, through pageMetadata().
 */

// Shared with pageMetadata(), which lists this image on every page.
export const alt = SOCIAL_IMAGE.alt;
export const size = { width: SOCIAL_IMAGE.width, height: SOCIAL_IMAGE.height };
export const contentType = SOCIAL_IMAGE.type;

// Static instances of the site's font: the image renderer can't read variable fonts or woff2.
// From Google Fonts, under the SIL Open Font License (assets/fonts/OFL.txt).
const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));
const [expandedExtraBold, regular, medium] = await Promise.all([
  font("Archivo-ExpandedExtraBold.ttf"),
  font("Archivo-Regular.ttf"),
  font("Archivo-Medium.ttf"),
]);

const SCREEN = "#0b0b0d"; // --color-screen in globals.css

export default function OpengraphImage() {
  return new ImageResponse(
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "white" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 88,
          padding: "0 64px",
          background: "black",
          color: "white",
        }}
      >
        <div style={{ fontFamily: "Archivo Expanded", fontSize: 30 }}>{SITE_NAME}</div>
        <div style={{ fontFamily: "Archivo", fontWeight: 500, fontSize: 26, color: "rgb(255 255 255 / 0.7)" }}>
          omviewer.com
        </div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56, padding: "0 64px" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 28 }}>
          <div style={{ fontFamily: "Archivo Expanded", fontSize: 58, lineHeight: 1.1, color: "black" }}>
            See the recipe behind your photo
          </div>
          <div style={{ fontFamily: "Archivo", fontSize: 28, lineHeight: 1.4, color: "#52525b" }}>
            Color Profile, Monochrome Profile and picture settings from OM System JPEGs.
          </div>
        </div>
        <div style={{ display: "flex", padding: 28, borderRadius: 20, background: SCREEN }}>
          <img src={wheelSvg()} width={360} height={360} alt="" />
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Archivo Expanded", data: expandedExtraBold, weight: 800, style: "normal" },
        { name: "Archivo", data: regular, weight: 400, style: "normal" },
        { name: "Archivo", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}

/** An example Color Profile, so the wheel has a shape: a value from −5 to +5 for each hue. */
const EXAMPLE_VALUES = [2, 3, 1, 0, -2, -1, 1, 3, 4, 1, -1, 2];
const MIN = -5;
const MAX = 5;

/**
 * The Simple view's Color Profile wheel (see hue-wheel.tsx) as an SVG data URL. The renderer has no
 * conic gradient, so the colored fill is 12 wedges, each shading from its hue to the next, under the
 * same gray fade toward the middle.
 */
function wheelSvg(): string {
  const colors = COLOR_PROFILE_HUES.map((hue) => HUE_SWATCHES[hue]);
  const count = colors.length;
  const at = (radius: number, i: number) => polar(radius, hueAngle(i, count));
  const ring = (radius: number) => points(colors.map((_, i) => at(radius, i)));
  const dots = EXAMPLE_VALUES.map((value, i) => at(levelRadius(value, MIN, MAX), i));
  const shape = points(dots);
  const outline = ring(WHEEL.outline);
  // Just the wheel and a little margin: the image has no value labels around it.
  const r = WHEEL.outline + WHEEL.outlineWidth;

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
  const sides = colors.map((_, i) => `<polygon points="${outlineSide(i, count)}" fill="url(#side-${i})"/>`);
  const dotMarks = dots.map(
    ([x, y], i) =>
      `<circle cx="${x}" cy="${y}" r="${WHEEL.dot}" fill="${colors[i]}" stroke="white" stroke-opacity="0.85" stroke-width="1.25"/>`,
  );

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-r} ${-r} ${2 * r} ${2 * r}">` +
    `<defs>${gradients.join("")}` +
    // The fade to gray toward the middle, as in colorWheelFill.
    `<radialGradient id="fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="${WHEEL.outline}">` +
    `<stop offset="0.2" stop-color="rgb(${CENTER_GRAY})"/>` +
    `<stop offset="0.6" stop-color="rgb(${CENTER_GRAY})" stop-opacity="0.55"/>` +
    `<stop offset="1" stop-color="rgb(${CENTER_GRAY})" stop-opacity="0"/>` +
    `</radialGradient></defs>` +
    `<g>` +
    wedges.join("") +
    `<polygon points="${outline}" fill="url(#fade)"/>` +
    `<path d="M${outline}Z M${shape}Z" fill="black" fill-opacity="0.5" fill-rule="evenodd"/>` +
    `<polygon points="${shape}" fill="white" fill-opacity="0.38"/>` +
    `<g stroke="white" stroke-width="1" fill="none">${spokes.join("")}` +
    `<polygon points="${ring(WHEEL.minRadius)}" fill="rgb(${CENTER_GRAY})" fill-opacity="0.35" stroke-opacity="0.5"/>` +
    `<polygon points="${ring(levelRadius(0, MIN, MAX))}" stroke-opacity="0.5"/></g>` +
    `<polygon points="${shape}" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>` +
    sides.join("") +
    dotMarks.join("") +
    `</g></svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
