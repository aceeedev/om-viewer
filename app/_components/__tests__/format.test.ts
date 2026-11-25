import { describe, expect, it } from "vitest";
import * as fmt from "../format";

describe("format", () => {
  it("signs values with a true minus sign", () => {
    expect(fmt.signed(4)).toBe("+4");
    expect(fmt.signed(0)).toBe("0");
    expect(fmt.signed(-2)).toBe("−2");
    expect(fmt.level(4)).toBe("+4");
    expect(fmt.level(0)).toBe("±0");
    expect(fmt.level(-4)).toBe("−4");
  });

  it("prints exposure compensation to one decimal, as the camera does", () => {
    expect(fmt.evLevel(0.3333)).toBe("+0.3");
    expect(fmt.evLevel(-2 / 3)).toBe("−0.7");
    expect(fmt.evLevel(-1)).toBe("−1.0");
    expect(fmt.evLevel(0)).toBe("±0.0");
    expect(fmt.evLevel(-0.01)).toBe("±0.0"); // rounds to zero: no sign
  });

  it("prints compact labels without a plus sign", () => {
    expect(fmt.plain(4)).toBe("4");
    expect(fmt.plain(0)).toBe("0");
    expect(fmt.plain(-0)).toBe("0");
    expect(fmt.plain(-1)).toBe("−1");
  });

  it("formats ranges, dropping signs for non-negative ones", () => {
    expect(fmt.rangeText(-5, 5)).toBe("−5 to +5");
    expect(fmt.rangeText(0, 3)).toBe("0 to 3");
    expect(fmt.rangedValue(2, 0)).toBe("2");
    expect(fmt.rangedValue(2, -2)).toBe("+2");
    expect(fmt.rangedValue(0, -2)).toBe("±0");
    expect(fmt.rangedValue(0, 0)).toBe("0");
  });

  it("formats exposure values", () => {
    expect(fmt.shutterSpeed(0.004)).toBe("1/250 s");
    expect(fmt.shutterSpeed(1 / 3)).toBe("1/3 s");
    expect(fmt.shutterSpeed(0.3)).toBe("0.3 s");
    expect(fmt.shutterSpeed(2)).toBe("2 s");
    expect(fmt.aperture(4)).toBe("f/4");
    expect(fmt.aperture(5.6)).toBe("f/5.6");
    expect(fmt.focalLength(20)).toBe("20 mm");
    expect(fmt.exposureCompensation(0)).toBe("±0.0 EV");
    expect(fmt.exposureCompensation(-0.7)).toBe("−0.7 EV");
    expect(fmt.exposureCompensation(1 / 3)).toBe("+0.3 EV");
  });

  it("formats EXIF dates with their UTC offset", () => {
    expect(fmt.dateTime("2026:01:02 03:04:05", "-08:00")).toBe("2026-01-02 03:04:05 (UTC−08:00)");
    expect(fmt.dateTime("2026:01:02 03:04:05", "+09:00")).toBe("2026-01-02 03:04:05 (UTC+09:00)");
    expect(fmt.dateTime("2026:01:02 03:04:05")).toBe("2026-01-02 03:04:05");
    expect(fmt.dateTime("garbage")).toBe("garbage");
  });

  it("names a white balance fine-tune by the direction of each shift", () => {
    expect(fmt.fineTune(4, 0)).toBe("A4.G0");
    expect(fmt.fineTune(2, -2)).toBe("A2.M2"); // as on the camera's screen
    expect(fmt.fineTune(-3, -2)).toBe("B3.M2");
    expect(fmt.fineTuneWords(4, 0)).toBe("amber 4, green 0");
    expect(fmt.fineTuneWords(-3, -2)).toBe("blue 3, magenta 2");
  });
});
