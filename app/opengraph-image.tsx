import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE_NAME, SOCIAL_IMAGE } from "@/lib/site";
import { colorWheelSvg } from "./_components/simple/wheel-svg";

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

/** The full wheel, as in the Simple view, as an SVG data URL for the image's <img>. */
function wheelSvg(): string {
  const svg = colorWheelSvg(EXAMPLE_VALUES, { min: -5, max: 5 });
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
