import { describe, expect, it } from "vitest";
import { COLOR_PROFILE_HUES } from "@/lib/recipe/tags";
import { HUE_SWATCHES } from "../sections";
import { WHEEL } from "../simple/wheel-geometry";
import { COLOR_PROFILE_RANGE as RANGE, EXAMPLE_VALUES as VALUES, SCREEN_COLOR, colorWheelSvg } from "../simple/wheel-svg";

const count = (svg: string, text: string) => svg.split(text).length - 1;

describe("colorWheelSvg", () => {
  it("draws the whole wheel in the viewer's hue colors by default", () => {
    const svg = colorWheelSvg(VALUES, RANGE);
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    for (const hue of COLOR_PROFILE_HUES) expect(svg).toContain(HUE_SWATCHES[hue]);
    expect(count(svg, 'fill="url(#side-')).toBe(12); // the outline's sides
    expect(count(svg, 'fill="url(#fill-')).toBe(72); // the colored fill, 6 thin wedges per hue
    expect(svg).toContain('<radialGradient id="fade"');
    expect(count(svg, "<line ")).toBe(12);
    expect(count(svg, "<circle ")).toBe(12);
  });

  it("shades the fill from each hue to the next, meeting the outline's colors", () => {
    const svg = colorWheelSvg(VALUES, RANGE);
    const stops = (id: string) => {
      const stop = (offset: number) => `<stop offset="${offset}" stop-color="(#\\w+)"/>`;
      return svg.match(new RegExp(`<linearGradient id="${id}"[^>]*>${stop(0)}${stop(1)}`))?.slice(1);
    };
    // Yellow's share: from Yellow to Orange in six steps, halfway at the third.
    expect(stops("side-0")).toEqual([HUE_SWATCHES.Yellow, HUE_SWATCHES.Orange]);
    expect(stops("fill-0-0")?.[0]).toBe(HUE_SWATCHES.Yellow);
    expect(stops("fill-0-2")?.[1]).toBe("#fdc61f"); // #fbe405 and #ffa839 mixed
    expect(stops("fill-0-3")?.[0]).toBe("#fdc61f");
    expect(stops("fill-0-5")?.[1]).toBe(HUE_SWATCHES.Orange);
    // The last share wraps round, from Yellow-green back to Yellow.
    expect(stops("fill-11-5")?.[1]).toBe(HUE_SWATCHES.Yellow);
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
    expect(count(svg, 'fill="url(#side-')).toBe(12);
    expect(count(svg, 'fill="url(#fill-')).toBe(72);
    expect(svg).toContain('fill-rule="evenodd"');
    expect(svg).toContain('stroke="white" stroke-width="2"');
  });

  it("draws the shape's outline at the given width", () => {
    expect(colorWheelSvg(VALUES, { ...RANGE, shapeWidth: 6 })).toContain('stroke="white" stroke-width="6"');
  });

  it("draws no screen behind the wheel by default", () => {
    expect(colorWheelSvg(VALUES, RANGE)).not.toContain("<rect ");
  });

  it("puts the wheel on a camera-style screen when asked, widening the frame by its padding", () => {
    const svg = colorWheelSvg(VALUES, { ...RANGE, screen: { padding: 10, radius: 40 } });
    const r = WHEEL.outline + WHEEL.outlineWidth + 10;
    expect(svg).toContain(`viewBox="${-r} ${-r} ${2 * r} ${2 * r}"`);
    expect(svg).toContain(`<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" rx="40" fill="${SCREEN_COLOR}"/>`);
    // Behind everything else: the screen comes before the wheel's colors.
    expect(svg.indexOf("<rect ")).toBeLessThan(svg.indexOf('fill="url(#side-0)"'));
  });

  it("needs one value per hue", () => {
    expect(() => colorWheelSvg([1, 2, 3], RANGE)).toThrow("Expected 12 hue values, got 3");
  });
});
