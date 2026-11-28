import { describe, expect, it } from "vitest";
import { COLOR_PROFILE_HUES } from "@/lib/recipe/tags";
import { WHEEL } from "../_components/simple/wheel-geometry";
import { MASKABLE_WHEEL_SHARE } from "../_components/wheel-icon";
import { GET as icon192 } from "../manifest-icons/192.png/route";
import { GET as icon512 } from "../manifest-icons/512.png/route";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("manifest icons", () => {
  it.each([
    [192, icon192],
    [512, icon512],
  ])("renders a %i × %i PNG", async (size, GET) => {
    const response = GET();
    expect(response.headers.get("Content-Type")).toBe("image/png");
    const png = Buffer.from(await response.arrayBuffer());
    expect(png.subarray(0, 8)).toEqual(PNG_SIGNATURE);
    // The IHDR chunk comes first: width and height, big-endian, after its length and type.
    expect(png.subarray(12, 16).toString("ascii")).toBe("IHDR");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([size, size]);
  }, 30_000);

  it("keeps the whole wheel inside the centered circle, 80% wide, that Android never crops", () => {
    // The outline's outer corners, against the wheel image's half-width (wheel-svg's viewBox).
    const corner = WHEEL.outline + WHEEL.outlineWidth / 2 / Math.cos(Math.PI / COLOR_PROFILE_HUES.length);
    const halfWidth = WHEEL.outline + WHEEL.outlineWidth;
    const reach = (MASKABLE_WHEEL_SHARE * corner) / halfWidth; // across the icon, as a share of its width
    expect(reach).toBeLessThanOrEqual(0.8);
    expect(reach).toBeGreaterThan(0.7); // and not needlessly small
  });
});
