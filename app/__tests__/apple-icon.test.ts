import { describe, expect, it } from "vitest";
import AppleIcon, { contentType, size } from "../apple-icon";

describe("Apple touch icon", () => {
  it("is listed as the 180 × 180 PNG iOS asks for", () => {
    expect(size).toEqual({ width: 180, height: 180 });
    expect(contentType).toBe("image/png");
  });

  it("renders a 180 × 180 PNG", async () => {
    const png = Buffer.from(await AppleIcon().arrayBuffer());
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    // The IHDR chunk comes first: width and height, big-endian, after its length and type.
    expect(png.subarray(12, 16).toString("ascii")).toBe("IHDR");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([180, 180]);
  }, 30_000);
});
