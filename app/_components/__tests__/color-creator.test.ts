import { describe, expect, it } from "vitest";
import { HUE_SWATCHES } from "../sections";
import { hueStepColor } from "../simple/color-creator";

describe("Color Creator hue ring colors", () => {
  it("spreads the hue wheel's palette around the ring, yellow at the top", () => {
    // 30 steps over 12 colors: every 2.5 steps lands on one of them.
    expect(hueStepColor(0, 30)).toBe(HUE_SWATCHES.Yellow);
    expect(hueStepColor(5, 30)).toBe(HUE_SWATCHES["Orange-red"]); // 60° clockwise
    expect(hueStepColor(15, 30)).toBe(HUE_SWATCHES.Blue); // opposite yellow
    expect(hueStepColor(25, 30)).toBe(HUE_SWATCHES.Green);
  });

  it("mixes the colors on either side for the steps between them", () => {
    // Step 1 is 0.4 of the way from Yellow (#fbe405) to Orange (#ffa839).
    expect(hueStepColor(1, 30)).toBe("#fdcc1a");
    // Step 12 is 0.8 of the way from Magenta (#d227b0) to Violet (#8e3de8).
    expect(hueStepColor(12, 30)).toBe("#9c39dd");
  });

  it("gives each of the 30 steps its own color, wrapping back to yellow", () => {
    const colors = Array.from({ length: 30 }, (_, i) => hueStepColor(i, 30));
    expect(new Set(colors).size).toBe(30);
    expect(hueStepColor(30, 30)).toBe(hueStepColor(0, 30));
    expect(hueStepColor(-1, 30)).toBe(hueStepColor(29, 30));
    for (const c of colors) expect(c).toMatch(/^#[0-9a-f]{6}$/);
  });
});
