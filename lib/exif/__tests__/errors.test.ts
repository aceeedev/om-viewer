import { describe, expect, it } from "vitest";
import { parseJpeg, readPhotoMetadata } from "@/lib/exif";
import { buildJpeg, buildMakerNote, buildOmJpeg, buildTiff } from "./helpers/build-jpeg";

const errorCode = (bytes: Uint8Array) => {
  const result = parseJpeg(bytes);
  return result.ok ? "ok" : result.error.code;
};

describe("parser errors", () => {
  it("rejects non-JPEG input", () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(errorCode(png)).toBe("not-jpeg");
    expect(errorCode(new Uint8Array(0))).toBe("not-jpeg");
  });

  it("reports a JPEG without EXIF", () => {
    expect(errorCode(buildJpeg(null))).toBe("no-exif");
  });

  it("reports EXIF without a maker note", () => {
    const tiff = buildTiff([
      { tag: 0x010f, type: "ascii", value: "OM Digital Solutions" },
      { tag: 0x8769, type: "ifd", as: "long", value: [{ tag: 0x829a, type: "rational", value: [[1, 60]] }] },
    ]);
    expect(errorCode(buildJpeg(tiff))).toBe("no-makernote");
  });

  it("reports a maker note from another brand, naming the make", () => {
    const tiff = buildTiff([
      { tag: 0x010f, type: "ascii", value: "Canon" },
      {
        tag: 0x8769,
        type: "ifd",
        as: "long",
        value: [{ tag: 0x927c, type: "undefined", value: new Uint8Array(64).fill(7) }],
      },
    ]);
    const result = parseJpeg(buildJpeg(tiff));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("unsupported-makernote");
      expect(result.error.message).toContain("Canon");
    }
  });

  it("reports a broken TIFF header as corrupt", () => {
    const tiff = buildTiff([{ tag: 0x010f, type: "ascii", value: "OM Digital Solutions" }]);
    tiff[2] = 0x99; // break the 42 magic number
    expect(errorCode(buildJpeg(tiff))).toBe("corrupt");
  });

  it("keeps going when a sub-IFD pointer is out of range", () => {
    const makerNote = buildMakerNote("OM SYSTEM", [
      { tag: 0x2020, type: "u32", value: [0x7fffffff] },
    ]);
    const result = parseJpeg(buildOmJpeg({ makerNote }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.metadata.makerNote.cameraSettings).toBeUndefined();
  });

  it("never throws on any truncation of a valid file", async () => {
    const bytes = buildOmJpeg();
    for (let length = 0; length <= bytes.length; length++) {
      const cut = bytes.slice(0, length);
      expect(() => parseJpeg(cut)).not.toThrow();
      await expect(readPhotoMetadata(new Blob([cut]))).resolves.toBeDefined();
    }
    // A cut inside the Exif segment is reported, not silently accepted.
    expect(errorCode(bytes.slice(0, bytes.length - 20))).toBe("corrupt");
  });

  it("never throws on random byte corruption", () => {
    const original = buildOmJpeg();
    let seed = 12345;
    const random = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let round = 0; round < 2000; round++) {
      const bytes = original.slice();
      const flips = 1 + Math.floor(random() * 8);
      for (let i = 0; i < flips; i++) {
        bytes[2 + Math.floor(random() * (bytes.length - 2))] = Math.floor(random() * 256);
      }
      expect(() => parseJpeg(bytes)).not.toThrow();
    }
  });
});
