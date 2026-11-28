import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT_NAME, THEME_COLOR } from "@/lib/site";

/** The PNG icons drawn by app/manifest-icons/. */
const ICON_SIZES = [192, 512] as const;

/**
 * The web app manifest: the name, icon and colors a phone or computer uses when the site is added to the
 * home screen or installed. Next links it from every page.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: SITE_NAME,
    short_name: SITE_SHORT_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    // Opened from the home screen, it runs without the browser's bars, like an app.
    display: "standalone",
    background_color: "#ffffff", // the page's own background, shown while it opens
    theme_color: THEME_COLOR,
    // Each size is listed twice: as a plain icon, and as one Android may crop to its own shape. The wheel
    // sits inside the area Android always keeps, so one image does both.
    icons: ICON_SIZES.flatMap((size) =>
      (["any", "maskable"] as const).map((purpose) => ({
        src: `/manifest-icons/${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose,
      })),
    ),
  };
}
