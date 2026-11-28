import { maskableWheelIcon } from "../../_components/wheel-icon";

/** The web app manifest's 192 × 192 icon, the size Android's home screen uses. */
export function GET() {
  return maskableWheelIcon(192);
}
