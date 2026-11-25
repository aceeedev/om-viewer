import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { entryNumber, entryText, parseJpeg } from "@/lib/exif";
import { buildRecipe } from "@/lib/recipe";
import { randomSample, SAMPLE_MAX_EDGE, SAMPLE_PHOTOS, SAMPLE_SOURCE_PAGE, samplePath } from "../sample-photos";

const PUBLIC_DIR = path.join(import.meta.dirname, "..", "..", "public");
const MAX_BYTES = 1024 * 1024;

/** Where each serial number lives: Olympus Equipment IFD and the Exif IFD. */
const EQUIPMENT_SERIALS = { SerialNumber: 0x0101, InternalSerialNumber: 0x0102, LensSerialNumber: 0x0202 };
const EXIF_SERIALS = { BodySerialNumber: 0xa431, LensSerialNumber: 0xa435 };
const EXIF_IMAGE_WIDTH = 0xa002;
const EXIF_IMAGE_HEIGHT = 0xa003;

describe("SAMPLE_PHOTOS", () => {
  it("has photos to pick from, credited and linked", () => {
    expect(SAMPLE_PHOTOS.length).toBeGreaterThan(0);
    expect(new URL(SAMPLE_SOURCE_PAGE.url).protocol).toBe("https:");
    for (const photo of SAMPLE_PHOTOS) {
      expect(photo.name).toMatch(/^[A-Za-z0-9._-]+\.jpe?g$/i);
      expect(photo.title.trim()).not.toBe("");
      expect(photo.artist.trim()).not.toBe("");
      expect(new URL(photo.artistUrl).protocol).toBe("https:");
      expect(new URL(photo.source).protocol).toBe("https:");
    }
  });

  it("has no repeats", () => {
    expect(new Set(SAMPLE_PHOTOS.map((p) => p.name)).size).toBe(SAMPLE_PHOTOS.length);
    expect(new Set(SAMPLE_PHOTOS.map((p) => p.source)).size).toBe(SAMPLE_PHOTOS.length);
  });

  it("matches public/samples/ exactly (run `pnpm samples:build` after editing the list)", () => {
    const files = readdirSync(path.join(PUBLIC_DIR, "samples")).sort();
    expect(files).toEqual(SAMPLE_PHOTOS.map((p) => p.name).sort());
  });
});

describe.each(SAMPLE_PHOTOS.map((photo) => [photo.name, photo] as const))("%s", (_name, photo) => {
  const bytes = new Uint8Array(readFileSync(path.join(PUBLIC_DIR, samplePath(photo))));
  const result = parseJpeg(bytes);

  it("is small", () => {
    expect(bytes.byteLength).toBeLessThanOrEqual(MAX_BYTES);
  });

  it("opens as a recipe", () => {
    if (!result.ok) throw new Error(result.error.message);
    const recipe = buildRecipe(result.metadata);
    expect(recipe.profile.kind).toBeTruthy();
    expect(recipe.camera.model).toBeTruthy();
  });

  it("says its real (shrunk) size", () => {
    if (!result.ok) throw new Error(result.error.message);
    const { exifIfd } = result.metadata;
    const width = entryNumber(exifIfd.get(EXIF_IMAGE_WIDTH)) ?? 0;
    const height = entryNumber(exifIfd.get(EXIF_IMAGE_HEIGHT)) ?? 0;
    expect(Math.max(width, height)).toBeGreaterThan(0);
    expect(Math.max(width, height)).toBeLessThanOrEqual(SAMPLE_MAX_EDGE);
  });

  it("carries no camera or lens serial numbers", () => {
    if (!result.ok) throw new Error(result.error.message);
    const { makerNote, exifIfd } = result.metadata;
    // Without the Equipment block the checks below would pass by default.
    expect(makerNote.equipment?.has(EQUIPMENT_SERIALS.SerialNumber)).toBe(true);
    for (const [name, tag] of Object.entries(EQUIPMENT_SERIALS)) {
      expect(entryText(makerNote.equipment?.get(tag))?.trim() ?? "", name).toBe("");
    }
    for (const [name, tag] of Object.entries(EXIF_SERIALS)) expect(exifIfd.has(tag), name).toBe(false);
    const text = new TextDecoder("latin1").decode(bytes);
    expect(text).not.toMatch(/aux:(Lens)?SerialNumber/); // XMP
  });
});

describe("randomSample", () => {
  /** A fake Math.random that returns these values in turn. */
  const sequence = (...values: number[]) => () => values.shift() ?? 0;

  it("can pick every sample, from either end of the random range", () => {
    const picked = new Set<string>();
    const n = SAMPLE_PHOTOS.length;
    for (let i = 0; i < n; i++) picked.add(randomSample(undefined, sequence(i / n)).name);
    expect(picked.size).toBe(n);
    expect(randomSample(undefined, sequence(0.999999999)).name).toBe(SAMPLE_PHOTOS[n - 1].name);
  });

  it("never picks the sample that's already open", () => {
    const open = SAMPLE_PHOTOS[0].name;
    for (let i = 0; i < 50; i++) expect(randomSample(open, sequence(i / 50)).name).not.toBe(open);
  });

  it("ignores a name that isn't a sample", () => {
    expect(randomSample("P1010042.JPG", sequence(0)).name).toBe(SAMPLE_PHOTOS[0].name);
  });
});
