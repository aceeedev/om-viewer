import { describe, expect, it } from "vitest";
import { COLOR_PROFILE_HUES } from "@/lib/recipe/tags";
import { HUE_SWATCHES } from "../sections";
import { WHEEL } from "../simple/wheel-geometry";
import { colorWheelSvg } from "../simple/wheel-svg";

const VALUES = [2, 3, 1, 0, -2, -1, 1, 3, 4, 1, -1, 2];
const RANGE = { min: -5, max: 5 };
const count = (svg: string, text: string) => svg.split(text).length - 1;

describe("colorWheelSvg", () => {
  it("draws the whole wheel in the viewer's hue colors by default", () => {
    const svg = colorWheelSvg(VALUES, RANGE);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    for (const hue of COLOR_PROFILE_HUES) expect(svg).toContain(HUE_SWATCHES[hue]);
    expect(count(svg, "<linearGradient ")).toBe(12);
    expect(count(svg, 'fill="url(#side-')).toBe(24); // a wedge and an outline side per hue
    expect(svg).toContain('<radialGradient id="fade"');
    expect(count(svg, "<line ")).toBe(12);
    expect(count(svg, "<circle ")).toBe(12);
  });

  it("frames the outline with a margin as wide as its line", () => {
    const r = WHEEL.outline + WHEEL.outlineWidth;
    expect(colorWheelSvg(VALUES, RANGE)).toContain(`viewBox="${-r} ${-r} ${2 * r} ${2 * r}"`);
    expect(colorWheelSvg(VALUES, { ...RANGE, outlineWidth: 14 })).toContain(
      `viewBox="${-(WHEEL.outline + 14)} ${-(WHEEL.outline + 14)} ${2 * (WHEEL.outline + 14)} ${2 * (WHEEL.outline + 14)}"`,
    );
  });

  it("leaves out the grid, the fade and the dots when asked", () => {
    const svg = colorWheelSvg(VALUES, { ...RANGE, grid: false, fade: false, dots: false });
    expect(svg).not.toContain("<line ");
    expect(svg).not.toContain("fade");
    expect(svg).not.toContain("<circle ");
    // The colors, the dimming outside the shape and the shape's outline stay.
    expect(count(svg, 'fill="url(#side-')).toBe(24);
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).toContain('stroke="white" stroke-width="2"');
  });

  it("draws the shape's outline at the given width", () => {
    expect(colorWheelSvg(VALUES, { ...RANGE, shapeWidth: 6 })).toContain('stroke="white" stroke-width="6"');
  });

  it("needs one value per hue", () => {
    expect(() => colorWheelSvg([1, 2, 3], RANGE)).toThrow("Expected 12 hue values, got 3");
  });
});
