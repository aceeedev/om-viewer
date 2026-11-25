/**
 * Test-only helpers for cross-checking against exiftool on real photos in `samples/`
 * (gitignored). Tests using these should skip when `samplesRunnable` is false.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

export const SAMPLES_DIR = path.resolve(process.cwd(), "samples");

export const sampleFiles: string[] = existsSync(SAMPLES_DIR)
  ? readdirSync(SAMPLES_DIR)
      .filter((f) => /\.jpe?g$/i.test(f))
      .sort()
  : [];

export const hasExiftool = spawnSync("exiftool", ["-ver"]).status === 0;

export const samplesRunnable = hasExiftool && sampleFiles.length > 0;

export type ExiftoolRecord = Record<string, unknown>;

/** Run exiftool once over `files` (relative to samples/) with JSON output; keyed by file name. */
export function runExiftool(args: string[], files: string[] = sampleFiles): Map<string, ExiftoolRecord> {
  if (!samplesRunnable) return new Map();
  const json = execFileSync("exiftool", ["-q", "-j", ...args, ...files], {
    cwd: SAMPLES_DIR,
    maxBuffer: 64 * 1024 * 1024,
  }).toString();
  const records = JSON.parse(json) as ExiftoolRecord[];
  return new Map(records.map((r) => [String(r.SourceFile), r]));
}

/** A tag from `exiftool -D` JSON output. */
export interface ExiftoolTag {
  id: number;
  val: unknown;
}

/**
 * Tags of one maker-note sub-IFD, sliced out of exiftool's file-ordered `-D -G1` JSON:
 * from `versionKey` (e.g. "Olympus:CameraSettingsVersion") up to the next "*Version" tag.
 */
export function exiftoolSection(record: ExiftoolRecord, versionKey: string): (ExiftoolTag & { key: string })[] {
  const out: (ExiftoolTag & { key: string })[] = [];
  let inside = false;
  for (const [key, value] of Object.entries(record)) {
    if (typeof value !== "object" || value === null || !("id" in value)) continue;
    const tag = value as ExiftoolTag;
    if (key === versionKey) inside = true;
    else if (inside && tag.id === 0 && key.endsWith("Version")) break;
    if (inside) out.push({ ...tag, key });
  }
  return out;
}
