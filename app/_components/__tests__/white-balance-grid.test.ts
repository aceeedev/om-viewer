import { describe, expect, it } from "vitest";
import { BOX_CENTER, WB_SCREEN, cursorPosition } from "../simple/white-balance-grid";

const shift = (amber: number, green: number) => ({
  amber: { value: amber, min: -7, max: 7 },
  green: { value: green, min: -7, max: 7 },
});
const [cx, cy] = BOX_CENTER;

describe("cursorPosition", () => {
  it("sits in the middle of the box with no shift", () => {
    expect(cursorPosition(shift(0, 0))).toEqual([140, 110]);
    expect(BOX_CENTER).toEqual([WB_SCREEN.box.x + WB_SCREEN.box.size / 2, WB_SCREEN.box.y + WB_SCREEN.box.size / 2]);
  });

  it("moves right for amber, left for blue, up for green, down for magenta, 9 units a step", () => {
    expect(cursorPosition(shift(4, 0))).toEqual([cx + 36, cy]);
    expect(cursorPosition(shift(-4, 0))).toEqual([cx - 36, cy]);
    expect(cursorPosition(shift(0, 2))).toEqual([cx, cy - 18]);
    expect(cursorPosition(shift(2, -2))).toEqual([cx + 18, cy + 18]); // the camera's A2.M2
  });

  it("gives every step its own whole-unit position", () => {
    const xs = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map((a) => cursorPosition(shift(a, 0))[0]);
    expect(xs.every(Number.isInteger)).toBe(true);
    expect(new Set(xs).size).toBe(15);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
  });

  it("reaches the inner side of each colored edge at ±7", () => {
    const { x, y, size, edge } = WB_SCREEN.box;
    expect(cursorPosition(shift(7, 7))).toEqual([x + size - edge, y + edge]);
    expect(cursorPosition(shift(-7, -7))).toEqual([x + edge, y + size - edge]);
  });

  it("clamps values beyond the range", () => {
    expect(cursorPosition(shift(9, -12))).toEqual(cursorPosition(shift(7, -7)));
  });

  it("leaves room for the tabs inside the drawing", () => {
    const { width, height, box, tab } = WB_SCREEN;
    expect(box.y - tab.gap - tab.short).toBeGreaterThan(0); // G
    expect(box.y + box.size + tab.gap + tab.short).toBeLessThan(height); // M
    expect(box.x - tab.gap - tab.side.short).toBeGreaterThan(0); // B
    expect(box.x + box.size + tab.gap + tab.side.short).toBeLessThan(width); // A
  });
});
