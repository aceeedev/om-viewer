import { ByteReader } from "./byte-reader";
import { findExifSegment } from "./jpeg";
import { parseOlympusMakerNote, type OlympusMakerNote } from "./olympus";
import { entryNumber, entryText, readIfd, readTiffHeader, type Ifd } from "./tiff";

export type { OlympusMakerNote, MakerNoteHeader } from "./olympus";
export type { EntryValue, Ifd, IfdEntry, Rational } from "./tiff";
export { MakerNoteTag } from "./olympus";
export { entryNumber, entryNumbers, entryText, TiffType } from "./tiff";

/** Standard EXIF tag IDs used here. */
export const ExifTag = {
  Make: 0x010f,
  Model: 0x0110,
  Software: 0x0131,
  ExifIfd: 0x8769,
  ExposureTime: 0x829a,
  FNumber: 0x829d,
  ISO: 0x8827,
  DateTimeOriginal: 0x9003,
  OffsetTimeOriginal: 0x9011,
  ExposureCompensation: 0x9204,
  FocalLength: 0x920a,
  MakerNote: 0x927c,
  LensModel: 0xa434,
} as const;

export interface ExifBasics {
  make?: string;
  model?: string;
  software?: string;
  lensModel?: string;
  /** Seconds. */
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  /** Millimetres. */
  focalLength?: number;
  /** EV. */
  exposureCompensation?: number;
  /** "YYYY:MM:DD HH:MM:SS" as written by the camera. */
  dateTimeOriginal?: string;
  /** e.g. "-08:00". */
  offsetTimeOriginal?: string;
}

export interface PhotoMetadata {
  exif: ExifBasics;
  ifd0: Ifd;
  exifIfd: Ifd;
  makerNote: OlympusMakerNote;
}

export type ReadErrorCode =
  | "not-jpeg"
  | "no-exif"
  | "no-makernote"
  | "unsupported-makernote"
  | "corrupt";

export interface ReadError {
  code: ReadErrorCode;
  message: string;
}

export type ReadResult = { ok: true; metadata: PhotoMetadata } | { ok: false; error: ReadError };

/** The Exif APP1 segment is near the start of the file, so this is plenty in practice. */
const INITIAL_READ_BYTES = 1024 * 1024;

/**
 * Read EXIF + OM System/Olympus maker notes from a JPEG.
 * For a Blob/File only the first 1 MB is read, unless the Exif segment runs past it.
 * Never throws for bad input; failures come back as `{ ok: false }`.
 */
export async function readPhotoMetadata(input: Blob | ArrayBuffer | Uint8Array): Promise<ReadResult> {
  if (!(input instanceof Blob)) return parseJpeg(input);

  const head = new Uint8Array(await input.slice(0, INITIAL_READ_BYTES).arrayBuffer());
  const first = parse(head);
  if (first !== "truncated") return first;
  if (input.size <= head.byteLength) return failure("corrupt");
  return parseJpeg(new Uint8Array(await input.arrayBuffer()));
}

/** Synchronous variant for an in-memory JPEG. */
export function parseJpeg(input: ArrayBuffer | Uint8Array): ReadResult {
  const result = parse(input instanceof Uint8Array ? input : new Uint8Array(input));
  return result === "truncated" ? failure("corrupt") : result;
}

function parse(bytes: Uint8Array): ReadResult | "truncated" {
  const segment = findExifSegment(bytes);
  if (segment.kind === "truncated") return "truncated";
  if (segment.kind === "not-jpeg") return failure("not-jpeg");
  if (segment.kind === "not-found") return failure("no-exif");

  try {
    const tiff = ByteReader.from(segment.tiff);
    const ifd0 = readIfd(tiff, readTiffHeader(tiff));
    const exifPointer = entryNumber(ifd0.get(ExifTag.ExifIfd));
    const exifIfd: Ifd = exifPointer === undefined ? new Map() : readIfd(tiff, exifPointer);
    const exif = readBasics(ifd0, exifIfd);

    const makerNoteEntry = exifIfd.get(ExifTag.MakerNote);
    if (!makerNoteEntry) return failure("no-makernote");

    const start = makerNoteEntry.valueOffset;
    const makerNote = parseOlympusMakerNote(tiff.sub(start, tiff.length - start));
    if (makerNote.kind === "unsupported") return failure("unsupported-makernote", exif.make);

    return { ok: true, metadata: { exif, ifd0, exifIfd, makerNote: makerNote.makerNote } };
  } catch {
    return failure("corrupt");
  }
}

function readBasics(ifd0: Ifd, exifIfd: Ifd): ExifBasics {
  const text = (ifd: Ifd, tag: number) => entryText(ifd.get(tag))?.trim() || undefined;
  const num = (ifd: Ifd, tag: number) => entryNumber(ifd.get(tag));
  return {
    make: text(ifd0, ExifTag.Make),
    model: text(ifd0, ExifTag.Model),
    software: text(ifd0, ExifTag.Software),
    lensModel: text(exifIfd, ExifTag.LensModel),
    exposureTime: num(exifIfd, ExifTag.ExposureTime),
    fNumber: num(exifIfd, ExifTag.FNumber),
    iso: num(exifIfd, ExifTag.ISO),
    focalLength: num(exifIfd, ExifTag.FocalLength),
    exposureCompensation: num(exifIfd, ExifTag.ExposureCompensation),
    dateTimeOriginal: text(exifIfd, ExifTag.DateTimeOriginal),
    offsetTimeOriginal: text(exifIfd, ExifTag.OffsetTimeOriginal),
  };
}

function failure(code: ReadErrorCode, make?: string): { ok: false; error: ReadError } {
  return { ok: false, error: { code, message: errorMessage(code, make) } };
}

function errorMessage(code: ReadErrorCode, make?: string): string {
  switch (code) {
    case "not-jpeg":
      return "This file isn't a JPEG.";
    case "no-exif":
      return "This JPEG has no EXIF data. It may have been exported by an app that strips metadata.";
    case "no-makernote":
      return "This JPEG has no camera maker notes, so its picture settings can't be read.";
    case "unsupported-makernote":
      return `This photo doesn't have OM System or Olympus maker notes${make ? ` (camera make: ${make})` : ""}.`;
    case "corrupt":
      return "This photo's metadata looks damaged and couldn't be read.";
  }
}
