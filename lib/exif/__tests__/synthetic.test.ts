import { describe, expect, it } from "vitest";
import { entryNumbers, entryText, parseJpeg, readPhotoMetadata, type PhotoMetadata } from "@/lib/exif";
import { buildOmJpeg } from "./helpers/build-jpeg";

function parseOk(bytes: Uint8Array): PhotoMetadata {
  const result = parseJpeg(bytes);
  if (!result.ok) throw new Error(`expected ok, got ${result.error.code}`);
  return result.metadata;
}

function expectSampleSettings(metadata: PhotoMetadata) {
  const cs = metadata.makerNote.cameraSettings;
  expect(cs).toBeDefined();
  const nums = (tag: number) => entryNumbers(cs!.get(tag));

  expect(nums(0x0520)).toEqual([9, 2]); // PictureMode: Color Profile 1
  expect(nums(0x0521)).toEqual([0, -2, 2]);
  expect(nums(0x0539)).toEqual([-5, 5, 4, 4, 4, 4, 0, -1, 1, 4, 4, 4, 4, 1]); // signed int16
  expect(nums(0x052e)?.slice(0, 12)).toEqual([-31999, 4, -7, 7, -31998, -4, -7, 7, -31997, 0, -7, 7]);
  expect(nums(0x0532)).toEqual([0, 0, 29, 0, -4, 3]);
  expect(nums(0x0537)).toEqual([0, 0, 8, 2, 0, 3]);
  expect(nums(0x0538)).toEqual([3]);
  expect(nums(0x053a)).toEqual([-3]);
  expect(nums(0x053b)).toEqual([1]);
  expect(nums(0x050d)).toEqual([2.7]);
  expect(nums(0x0535)).toEqual([NaN]); // 0/0 rational
  expect(entryText(cs!.get(0x0000))).toBe("0100");

  const eq = metadata.makerNote.equipment;
  expect(entryText(eq?.get(0x0100))).toBe("S0131");
  expect(entryText(eq?.get(0x0203))).toBe("OM 14-42mm F3.5-5.6 III");
}

describe("synthetic OM System / Olympus JPEGs", () => {
  const variants = [
    { header: "OM SYSTEM", le: true },
    { header: "OM SYSTEM", le: false },
    { header: "OLYMPUS", le: true },
    { header: "OLYMPUS", le: false },
  ] as const;

  it.each(variants)("decodes $header maker notes (littleEndian=$le)", ({ header, le }) => {
    const metadata = parseOk(buildOmJpeg({ header, le }));
    expect(metadata.makerNote.header).toBe(header);
    expect(metadata.makerNote.littleEndian).toBe(le);
    expect(metadata.makerNote.version).toBe(header === "OM SYSTEM" ? 4 : 3);
    expectSampleSettings(metadata);
  });

  it.each(["ifd", "long", "embedded"] as const)("follows sub-IFDs stored as %s", (subIfdAs) => {
    expectSampleSettings(parseOk(buildOmJpeg({ subIfdAs })));
  });

  it("reads the standard EXIF basics", () => {
    expect(parseOk(buildOmJpeg()).exif).toEqual({
      make: "OM Digital Solutions",
      model: "PEN",
      software: "Version 1.0",
      lensModel: "OM 14-42mm F3.5-5.6 III",
      exposureTime: 0.004,
      fNumber: 4,
      iso: 200,
      focalLength: 20,
      exposureCompensation: -0.7,
      dateTimeOriginal: "2026:10:23 13:57:06",
      offsetTimeOriginal: "-08:00",
    });
  });

  it("reads a Blob the same way as an in-memory buffer", async () => {
    const bytes = buildOmJpeg();
    const fromBlob = await readPhotoMetadata(new Blob([bytes]));
    expect(fromBlob).toEqual(parseJpeg(bytes));
  });

  it("re-reads the whole Blob when the Exif segment starts past the first 1 MB", async () => {
    const bytes = buildOmJpeg({ fillerBytes: 1_300_000 });
    expect(bytes.indexOf(0xe1)).toBeGreaterThan(1024 * 1024); // APP1 really is past 1 MB
    const result = await readPhotoMetadata(new Blob([bytes]));
    expect(result.ok).toBe(true);
    if (result.ok) expectSampleSettings(result.metadata);
  });
});
