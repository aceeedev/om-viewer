import { wheelIcon } from "./_components/wheel-icon";

/**
 * The icon iOS shows for a home screen bookmark: the Color Profile wheel on a camera-style screen, drawn
 * by wheelIcon(). iOS needs a PNG, and rounds the corners itself.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The wheel's width, leaving it clear of the corners iOS rounds off. */
const WHEEL_SIZE = 150;

export default function AppleIcon() {
  return wheelIcon(size.width, WHEEL_SIZE);
}
