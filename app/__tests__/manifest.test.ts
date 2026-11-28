import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SITE_NAME, SITE_SHORT_NAME, THEME_COLOR } from "@/lib/site";
import manifest from "../manifest";

describe("web app manifest", () => {
  it("names the site, with a short name that fits under a home screen icon", () => {
    const { name, short_name } = manifest();
    expect(name).toBe(SITE_NAME);
    expect(short_name).toBe(SITE_SHORT_NAME);
    expect(SITE_SHORT_NAME.length).toBeLessThanOrEqual(12);
  });

  it("opens the home page like an app, in the site's colors", () => {
    expect(manifest()).toMatchObject({
      id: "/",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: THEME_COLOR,
    });
  });

  it("lists 192 and 512 px PNGs, each as a plain and a maskable icon", () => {
    const icons = manifest().icons ?? [];
    expect(icons.map((icon) => `${icon.sizes} ${icon.purpose}`)).toEqual([
      "192x192 any",
      "192x192 maskable",
      "512x512 any",
      "512x512 maskable",
    ]);
    for (const icon of icons) {
      expect(icon.type).toBe("image/png");
      // Each one is served by its own route under app/.
      expect(existsSync(join(process.cwd(), "app", icon.src, "route.tsx"))).toBe(true);
    }
  });
});
