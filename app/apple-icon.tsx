import { ImageResponse } from "next/og";
import { COLOR_PROFILE_RANGE, EXAMPLE_VALUES, SCREEN_COLOR, colorWheelSvg } from "./_components/simple/wheel-svg";

/**
 * The icon iOS shows for a home screen bookmark: the social preview image's Color Profile wheel,
 * with its dots and grid (big enough here to stay clear), on a camera-style screen. iOS needs a
 * PNG. The screen fills the whole square, with no corners or transparency of its own: iOS rounds
 * the corners itself and shows transparent pixels as black.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The wheel's width, leaving it clear of the corners iOS rounds off. */
const WHEEL_SIZE = 150;

export default function AppleIcon() {
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
        width={WHEEL_SIZE}
        height={WHEEL_SIZE}
        alt=""
      />
    </div>,
    size,
  );
}
