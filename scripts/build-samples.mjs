// Rebuilds public/samples/ from the list in lib/sample-photos.ts: downloads each `source`, shrinks it to
// SAMPLE_MAX_EDGE, and keeps all of its metadata (the recipe lives in the maker notes) except the camera
// and lens serial numbers. Files in public/samples/ that aren't on the list are removed.
//
// Needs ImageMagick (`magick`) and ExifTool (`exiftool`) on PATH; the site itself doesn't.
// Run with: pnpm samples:build
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { SAMPLE_MAX_EDGE, SAMPLE_PHOTOS } from "../lib/sample-photos.ts";

const OUT_DIR = path.join(import.meta.dirname, "..", "public", "samples");

/** Serial-number tags. EXIF and XMP ones can be deleted; maker-note ones can only be overwritten. */
const SERIAL_TAGS = ["SerialNumber", "InternalSerialNumber", "LensSerialNumber"];
const DELETE_SERIALS = ["-ExifIFD:SerialNumber=", "-ExifIFD:LensSerialNumber=", "-XMP-aux:SerialNumber=", "-XMP-aux:LensSerialNumber="];
const BLANK_MAKER_NOTE_SERIALS = SERIAL_TAGS.map((tag) => `-Olympus:${tag}= `);

const run = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8" });

mkdirSync(OUT_DIR, { recursive: true });
const work = mkdtempSync(path.join(tmpdir(), "om-samples-"));

try {
  for (const photo of SAMPLE_PHOTOS) {
    const original = path.join(work, "original.jpg");
    const shrunk = path.join(work, "shrunk.jpg");

    const response = await fetch(photo.source);
    if (!response.ok) throw new Error(`${photo.source} answered ${response.status}`);
    writeFileSync(original, new Uint8Array(await response.arrayBuffer()));

    // The serials this original carries, to prove afterwards that none survived anywhere in the file.
    const serials = run("exiftool", ["-s3", "-a", ...SERIAL_TAGS.map((t) => `-${t}`), original])
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    // Shrink without metadata ("-strip"; ">" never enlarges), then copy every tag back from the original,
    // minus the thumbnail. Pixels aren't rotated, so the copied Orientation still holds. (-m: the
    // originals' camera preview sits past what ExifTool expects, which it reports as a minor error.)
    run("magick", [original, "-strip", "-resize", `${SAMPLE_MAX_EDGE}x${SAMPLE_MAX_EDGE}>`, "-quality", "82", "-sampling-factor", "4:2:0", shrunk]);
    run("exiftool", ["-q", "-m", "-overwrite_original", "-TagsFromFile", original, "-all:all", "-ThumbnailImage=", shrunk]);
    // A second pass: copying -all:all brings the maker notes over as one block, which would undo
    // edits to them made in the same command. Also fix the size the copied EXIF claims.
    run("exiftool", [
      "-q", "-m", "-overwrite_original",
      ...DELETE_SERIALS,
      ...BLANK_MAKER_NOTE_SERIALS,
      "-ExifIFD:ExifImageWidth<ImageWidth",
      "-ExifIFD:ExifImageHeight<ImageHeight",
      shrunk,
    ]);

    const bytes = readFileSync(shrunk);
    const leaked = serials.filter((serial) => bytes.includes(serial));
    if (leaked.length > 0) throw new Error(`${photo.name}: serial numbers survived (${leaked.join(", ")})`);

    writeFileSync(path.join(OUT_DIR, photo.name), bytes);
    const kb = (n) => `${Math.round(n / 1024)} KB`;
    console.log(`${photo.name}: ${kb(statSync(original).size)} → ${kb(bytes.length)}  (${photo.title}, ${photo.artist})`);
  }

  const listed = new Set(SAMPLE_PHOTOS.map((photo) => photo.name));
  for (const file of readdirSync(OUT_DIR)) {
    if (listed.has(file)) continue;
    rmSync(path.join(OUT_DIR, file));
    console.log(`${file}: removed (not on the list)`);
  }
} finally {
  if (existsSync(work)) rmSync(work, { recursive: true });
}
