import { describe, expect, it } from "vitest";
import { COLOR_PROFILE_HUES } from "@/lib/recipe/tags";
import { HUE_SWATCHES } from "../_components/sections";
import { SCREEN_COLOR } from "../_components/simple/wheel-svg";
import Icon, { contentType } from "../icon";

describe("site icon", () => {
  it("is served as SVG", () => {
    expect(contentType).toBe("image/svg+xml");
    expect(Icon().headers.get("Content-Type")).toBe("image/svg+xml");
  });

  it("draws the hue wheel in the viewer's colors, on the camera-style screen", async () => {
    const svg = await Icon().text();
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    for (const hue of COLOR_PROFILE_HUES) expect(svg).toContain(HUE_SWATCHES[hue]);
    expect(svg).toContain(`fill="${SCREEN_COLOR}"`);
  });

  it("leaves out what turns to mush at 16 px: the grid, the dots and the gray fade", async () => {
    const svg = await Icon().text();
    expect(svg).not.toContain("<line ");
    expect(svg).not.toContain("<circle ");
    expect(svg).not.toContain("fade");
  });

  it("keeps the shape, outlined in a bolder white line", async () => {
    const svg = await Icon().text();
    expect(svg).toContain('fill-rule="evenodd"'); // the dimming outside the shape
    expect(svg).toContain('stroke="white" stroke-width="8"');
  });
});
