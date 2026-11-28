import { maskableWheelIcon } from "../../_components/wheel-icon";

/** The web app manifest's 512 × 512 icon, for splash screens and installed-app icons on computers. */
export function GET() {
  return maskableWheelIcon(512);
}
