import { ByteReader } from "./byte-reader";
import { readIfd, TiffType, type Ifd } from "./tiff";

/**
 * OM Digital Solutions / Olympus maker notes.
 *
 * Layouts (from ExifTool's MakerNotes.pm, confirmed on OM System PEN samples):
 *   "OM SYSTEM\0" 00 00 <II|MM> <u16 version>  then IFD at +16   (OM System bodies)
 *   "OLYMPUS\0"   <II|MM> <u16 version>        then IFD at +12   (Olympus E-M / PEN-F era)
 * In both, value offsets are relative to the start of the maker note.
 * The legacy "OLYMP\0" layout (offsets relative to the TIFF header) is not supported.
 */

export const MakerNoteTag = {
  Equipment: 0x2010,
  CameraSettings: 0x2020,
} as const;

export type MakerNoteHeader = "OM SYSTEM" | "OLYMPUS";

export interface OlympusMakerNote {
  header: MakerNoteHeader;
  version: number;
  littleEndian: boolean;
  main: Ifd;
  equipment?: Ifd;
  cameraSettings?: Ifd;
}

export type MakerNoteResult =
  | { kind: "ok"; makerNote: OlympusMakerNote }
  | { kind: "unsupported"; signature: string };

const LAYOUTS: { header: MakerNoteHeader; signature: string; orderAt: number; ifdAt: number }[] = [
  { header: "OM SYSTEM", signature: "OM SYSTEM\0", orderAt: 12, ifdAt: 16 },
  { header: "OLYMPUS", signature: "OLYMPUS\0", orderAt: 8, ifdAt: 12 },
];

/**
 * Parse an Olympus-family maker note. `reader` must start at the maker note's first byte;
 * it may extend past the maker note's declared length (some values sit just beyond it).
 * Throws OutOfBoundsError/RangeError if the main IFD itself is unreadable.
 */
export function parseOlympusMakerNote(reader: ByteReader): MakerNoteResult {
  const layout = LAYOUTS.find((l) => reader.startsWith(0, l.signature));
  if (!layout) return { kind: "unsupported", signature: reader.ascii(0, Math.min(10, reader.length)) };

  const r = reader.sub(0, reader.length);
  if (r.startsWith(layout.orderAt, "II")) r.littleEndian = true;
  else if (r.startsWith(layout.orderAt, "MM")) r.littleEndian = false;
  else throw new RangeError(`${layout.header} maker note has no byte-order mark`);

  const version = r.u16(layout.orderAt + 2);
  const main = readIfd(r, layout.ifdAt, 0);

  return {
    kind: "ok",
    makerNote: {
      header: layout.header,
      version,
      littleEndian: r.littleEndian,
      main,
      equipment: readSubIfd(r, main, MakerNoteTag.Equipment),
      cameraSettings: readSubIfd(r, main, MakerNoteTag.CameraSettings),
    },
  };
}

/** Follow a sub-IFD stored either as a pointer (IFD/LONG) or embedded (UNDEFINED). */
function readSubIfd(r: ByteReader, main: Ifd, tag: number): Ifd | undefined {
  const entry = main.get(tag);
  if (!entry) return undefined;

  let offset: number | undefined;
  if ((entry.type === TiffType.IFD || entry.type === TiffType.LONG) && entry.value.kind === "int") {
    offset = entry.value.values[0];
  } else if (entry.type === TiffType.UNDEFINED) {
    offset = entry.valueOffset;
  }
  if (offset === undefined) return undefined;

  try {
    return readIfd(r, offset, 0);
  } catch {
    return undefined;
  }
}
