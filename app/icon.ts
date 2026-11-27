import { COLOR_PROFILE_RANGE, EXAMPLE_VALUES, colorWheelSvg } from "./_components/simple/wheel-svg";

/**
 * The site icon: the social preview image's Color Profile wheel, simplified to read at 16 px, on a
 * camera-style screen. Built at build time from the viewer's own colors and wheel geometry, and
 * served as SVG so it stays sharp at any size.
 */

export const contentType = "image/svg+xml";

export default function Icon() {
  const svg = colorWheelSvg(EXAMPLE_VALUES, {
    ...COLOR_PROFILE_RANGE,
    // The grid, the dots and the gray fade turn to mush this small.
    grid: false,
    dots: false,
    fade: false,
    // About 1 px and 0.6 px at 16 px.
    outlineWidth: 14,
    shapeWidth: 8,
    screen: { padding: 10, radius: 40 },
  });
  return new Response(svg, { headers: { "Content-Type": contentType } });
}
