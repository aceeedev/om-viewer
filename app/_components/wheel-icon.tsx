import { ImageResponse } from "next/og";
import { COLOR_PROFILE_RANGE, EXAMPLE_VALUES, SCREEN_COLOR, colorWheelSvg } from "./simple/wheel-svg";

/**
 * A square PNG app icon: the social preview image's Color Profile wheel, with its dots and grid (big
 * enough here to stay clear), on a camera-style screen. The screen fills the whole square, with no
 * corners or transparency of its own: phones cut the icon to their own shape, and iOS shows
 * transparent pixels as black. `wheelSize` is the wheel's width in pixels.
 */
export function wheelIcon(size: number, wheelSize: number): ImageResponse {
  const svg = colorWheelSvg(EXAMPLE_VALUES, COLOR_PROFILE_RANGE);
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background: SCREEN_COLOR,
      }}
    >
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`}
        width={wheelSize}
        height={wheelSize}
        alt=""
      />
    </div>,
    { width: size, height: size },
  );
}

/**
 * The wheel's width in a maskable icon, as a share of the icon's. Android crops these icons to its
 * own shape (a circle, a rounded square…) and only promises to keep a centered circle 80% as wide as
 * the icon. At this size the outline's corners reach about 78% across.
 */
export const MASKABLE_WHEEL_SHARE = 0.8;

/** A square PNG icon that Android can crop to any shape without cutting into the wheel. */
export function maskableWheelIcon(size: number): ImageResponse {
  return wheelIcon(size, Math.round(size * MASKABLE_WHEEL_SHARE));
}
