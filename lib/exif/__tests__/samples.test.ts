/**
 * Cross-checks the parser against exiftool on real photos in `samples/` (gitignored).
 * Skipped when exiftool isn't installed or there are no samples.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  readPhotoMetadata,
  type Ifd,
  type IfdEntry,
  type PhotoMetadata,
  type ReadResult,
} from "@/lib/exif";

const SAMPLES_DIR = path.resolve(process.cwd(), "samples");

const sampleFiles = existsSync(SAMPLES_DIR)
  ? readdirSync(SAMPLES_DIR)
      .filter((f) => /\.jpe?g$/i.test(f))
      .sort()
  : [];
const hasExiftool = spawnSync("exiftool", ["-ver"]).status === 0;

interface ExiftoolTag {
  id: number;
  val: unknown;
}
type ExiftoolRecord = Record<string, unknown>;

/** One exiftool run for all samples: JSON, numeric values (-n), tag IDs (-D), group-1 prefixes. */
function runExiftool(files: string[]): Map<string, ExiftoolRecord> {
  const json = execFileSync(
    "exiftool",
    ["-q", "-j", "-a", "-u", "-n", "-D", "-G1", "-EXIF:all", "-MakerNotes:all", ...files],
    { cwd: SAMPLES_DIR, maxBuffer: 64 * 1024 * 1024 },
  ).toString();
  const records = JSON.parse(json) as ExiftoolRecord[];
  return new Map(records.map((r) => [String(r.SourceFile), r]));
}

/** Tags of one maker-note sub-IFD, sliced out of exiftool's (file-ordered) JSON by its Version tag. */
function exiftoolSection(record: ExiftoolRecord, versionKey: string): ExiftoolTag[] {
  const out: ExiftoolTag[] = [];
  let inside = false;
  for (const [key, value] of Object.entries(record)) {
    if (typeof value !== "object" || value === null || !("id" in value)) continue;
    const tag = value as ExiftoolTag;
    if (key === versionKey) inside = true;
    else if (inside && tag.id === 0 && key.endsWith("Version")) break;
    if (inside) out.push(tag);
  }
  return out;
}

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

const runnable = hasExiftool && sampleFiles.length > 0;

describe.skipIf(!runnable)("samples match exiftool", () => {
  const exiftool = runnable ? runExiftool(sampleFiles) : new Map<string, ExiftoolRecord>();

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
