/**
 * Cross-checks the parser against exiftool on real photos in `samples/` (gitignored).
 * Skipped when exiftool isn't installed or there are no samples.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  readPhotoMetadata,
  type Ifd,
  type IfdEntry,
  type PhotoMetadata,
  type ReadResult,
} from "@/lib/exif";
import {
  exiftoolSection,
  runExiftool,
  SAMPLES_DIR,
  sampleFiles,
  samplesRunnable,
  type ExiftoolTag,
} from "@/lib/test-utils/samples";

/** Our entry as exiftool -n would print it, one token per value. */
function tokens(entry: IfdEntry): string[] {
  const v = entry.value;
  switch (v.kind) {
    case "int":
    case "float":
      return v.values.map(String);
    case "rational":
      return v.values.map(({ num, den }) =>
        den === 0 ? (num === 0 ? "undef" : num > 0 ? "inf" : "-inf") : String(num / den),
      );
    case "ascii":
      return [v.text];
    case "bytes":
      return [String.fromCharCode(...v.bytes)];
  }
}

function expectSameValue(entry: IfdEntry, expected: unknown, label: string) {
  if (entry.value.kind === "ascii") {
    expect(entry.value.text.trim(), label).toBe(String(expected).trim());
    return;
  }
  const ours = tokens(entry);
  const theirs = typeof expected === "number" ? [String(expected)] : String(expected).split(" ");
  expect(ours.length, `${label} value count`).toBe(theirs.length);
  ours.forEach((token, i) => {
    const a = Number(token);
    const b = Number(theirs[i]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      expect(Math.abs(a - b), `${label}[${i}]: ${token} vs ${theirs[i]}`).toBeLessThanOrEqual(
        1e-9 * Math.max(1, Math.abs(b)),
      );
    } else {
      expect(token, `${label}[${i}]`).toBe(theirs[i]);
    }
  });
}

const hex = (id: number) => `0x${id.toString(16).padStart(4, "0")}`;

describe.skipIf(!samplesRunnable)("samples match exiftool", () => {
  // JSON, numeric values (-n), tag IDs (-D), group-1 prefixes.
  const exiftool = runExiftool(["-a", "-u", "-n", "-D", "-G1", "-EXIF:all", "-MakerNotes:all"]);

  describe.each(sampleFiles)("%s", (file) => {
    const record = exiftool.get(file)!;
    let result: ReadResult;
    let metadata: PhotoMetadata;

    beforeAll(async () => {
      const bytes = readFileSync(path.join(SAMPLES_DIR, file));
      result = await readPhotoMetadata(new Blob([bytes]));
      if (!result.ok) throw new Error(`${file}: ${result.error.message}`);
      metadata = result.metadata;
    });

    it("parses as an OM System JPEG", () => {
      expect(result.ok).toBe(true);
      expect(metadata.makerNote.header).toBe("OM SYSTEM");
      expect(metadata.makerNote.cameraSettings).toBeDefined();
      expect(metadata.makerNote.equipment).toBeDefined();
    });

    it("EXIF basics match", () => {
      const e = metadata.exif;
      const want = (key: string) => (record[key] as ExiftoolTag | undefined)?.val;
      expect(e.make).toBe(want("IFD0:Make"));
      expect(e.model).toBe(want("IFD0:Model"));
      expect(e.software).toBe(want("IFD0:Software"));
      expect(e.lensModel).toBe(want("ExifIFD:LensModel"));
      expect(e.exposureTime).toBeCloseTo(want("ExifIFD:ExposureTime") as number, 9);
      expect(e.fNumber).toBe(want("ExifIFD:FNumber"));
      expect(e.iso).toBe(want("ExifIFD:ISO"));
      expect(e.focalLength).toBe(want("ExifIFD:FocalLength"));
      expect(e.exposureCompensation).toBeCloseTo(want("ExifIFD:ExposureCompensation") as number, 9);
      expect(e.dateTimeOriginal).toBe(want("ExifIFD:DateTimeOriginal"));
      expect(e.offsetTimeOriginal).toBe(want("ExifIFD:OffsetTimeOriginal"));
    });

    it("every CameraSettings tag in 0x0500-0x05ff matches", () => {
      const expected = exiftoolSection(record, "Olympus:CameraSettingsVersion").filter(
        (t) => t.id >= 0x0500 && t.id <= 0x05ff,
      );
      const ours = [...metadata.makerNote.cameraSettings!.values()].filter(
        (e) => e.tag >= 0x0500 && e.tag <= 0x05ff,
      );
      expect(expected.length, "exiftool CameraSettings 0x05xx tags").toBeGreaterThan(20);
      expect(ours.map((e) => hex(e.tag)).sort()).toEqual(expected.map((t) => hex(t.id)).sort());
      for (const t of expected) {
        expectSameValue(metadata.makerNote.cameraSettings!.get(t.id)!, t.val, `CameraSettings ${hex(t.id)}`);
      }
    });

    it("Equipment text tags match", () => {
      const equipment: Ifd = metadata.makerNote.equipment!;
      const expected = exiftoolSection(record, "Olympus:EquipmentVersion");
      const textTags = [...equipment.values()].filter((e) => e.value.kind === "ascii");
      expect(textTags.length).toBeGreaterThan(0);
      for (const entry of textTags) {
        const t = expected.find((x) => x.id === entry.tag);
        expect(t, `Equipment ${hex(entry.tag)} present in exiftool`).toBeDefined();
        expectSameValue(entry, t!.val, `Equipment ${hex(entry.tag)}`);
      }
    });
  });
});
