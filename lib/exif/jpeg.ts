import { ByteReader } from "./byte-reader";

export type ExifSegmentResult =
  | { kind: "found"; tiff: Uint8Array }
  | { kind: "not-jpeg" }
  /** Reached the image data (SOS) or end of image without an Exif APP1 segment. */
  | { kind: "not-found" }
  /** The buffer ended mid-header; a longer read may still find the segment. */
  | { kind: "truncated" };

const EXIF_ID = "Exif\0\0";

/** Walk the JPEG marker segments and return the TIFF payload of the first Exif APP1 segment. */
export function findExifSegment(bytes: Uint8Array): ExifSegmentResult {
  const r = ByteReader.from(bytes); // JPEG lengths are big-endian
  if (!r.has(0, 2) || r.u8(0) !== 0xff || r.u8(1) !== 0xd8) return { kind: "not-jpeg" };

  let pos = 2;
  while (true) {
    if (!r.has(pos, 2)) return { kind: "truncated" };
    if (r.u8(pos) !== 0xff) return { kind: "not-found" }; // lost sync: not a marker
    const marker = r.u8(pos + 1);

    if (marker === 0xff) {
      pos += 1; // fill byte
      continue;
    }
    if (marker === 0xda || marker === 0xd9) return { kind: "not-found" }; // SOS / EOI
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      pos += 2; // standalone markers with no length
      continue;
    }

    if (!r.has(pos + 2, 2)) return { kind: "truncated" };
    const length = r.u16(pos + 2); // includes the 2 length bytes
    if (length < 2) return { kind: "not-found" };
    const dataStart = pos + 4;
    const dataLength = length - 2;

    if (marker === 0xe1 && r.startsWith(dataStart, EXIF_ID)) {
      if (!r.has(dataStart, dataLength)) return { kind: "truncated" };
      return {
        kind: "found",
        tiff: r.bytes(dataStart + EXIF_ID.length, dataLength - EXIF_ID.length),
      };
    }
    pos = dataStart + dataLength;
  }
}
