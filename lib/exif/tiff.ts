import { ByteReader } from "./byte-reader";

/** TIFF field types (TIFF 6.0 + the IFD type used by EXIF maker notes). */
export const TiffType = {
  BYTE: 1,
  ASCII: 2,
  SHORT: 3,
  LONG: 4,
  RATIONAL: 5,
  SBYTE: 6,
  UNDEFINED: 7,
  SSHORT: 8,
  SLONG: 9,
  SRATIONAL: 10,
  FLOAT: 11,
  DOUBLE: 12,
  IFD: 13,
} as const;

const TYPE_SIZE: Record<number, number> = {
  1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8, 13: 4,
};

export interface Rational {
  num: number;
  den: number;
}

export type EntryValue =
  | { kind: "ascii"; text: string }
  /** BYTE, SHORT, LONG, SBYTE, SSHORT, SLONG and IFD, decoded with the signedness of the stored type. */
  | { kind: "int"; values: number[] }
  | { kind: "rational"; values: Rational[] }
  | { kind: "float"; values: number[] }
  | { kind: "bytes"; bytes: Uint8Array };

export interface IfdEntry {
  tag: number;
  type: number;
  count: number;
  /** Offset of the value bytes inside the reader (inline or pointed-to). */
  valueOffset: number;
  value: EntryValue;
}

export type Ifd = Map<number, IfdEntry>;

/** Hard cap on entries per IFD; real ones have well under 200. */
const MAX_ENTRIES = 1000;

/**
 * Read one IFD at `ifdOffset`. Values over 4 bytes live at `valueBase + storedOffset`
 * (TIFF IFDs: valueBase 0; OM SYSTEM/OLYMPUS maker notes: the maker-note start).
 * Entries with unknown types or out-of-range values are skipped, not thrown.
 * Throws OutOfBoundsError if the IFD table itself is out of range.
 */
export function readIfd(reader: ByteReader, ifdOffset: number, valueBase = 0): Ifd {
  const count = reader.u16(ifdOffset);
  if (count > MAX_ENTRIES) throw new RangeError(`IFD at ${ifdOffset} claims ${count} entries`);
  // Validate the whole table up front so a bad offset fails fast.
  if (!reader.has(ifdOffset + 2, count * 12)) {
    throw new RangeError(`IFD at ${ifdOffset} with ${count} entries runs past the buffer`);
  }

  const ifd: Ifd = new Map();
  for (let i = 0; i < count; i++) {
    const at = ifdOffset + 2 + i * 12;
    const tag = reader.u16(at);
    const type = reader.u16(at + 2);
    const n = reader.u32(at + 4);
    const size = TYPE_SIZE[type];
    if (size === undefined) continue;

    const byteLength = size * n;
    const valueOffset = byteLength <= 4 ? at + 8 : valueBase + reader.u32(at + 8);
    if (!reader.has(valueOffset, byteLength)) continue;

    ifd.set(tag, { tag, type, count: n, valueOffset, value: decodeValue(reader, type, n, valueOffset) });
  }
  return ifd;
}

function decodeValue(r: ByteReader, type: number, n: number, at: number): EntryValue {
  const ints = (size: number, read: (o: number) => number): EntryValue => {
    const values = new Array<number>(n);
    for (let i = 0; i < n; i++) values[i] = read(at + i * size);
    return { kind: "int", values };
  };
  const rationals = (signed: boolean): EntryValue => {
    const values = new Array<Rational>(n);
    for (let i = 0; i < n; i++) {
      const o = at + i * 8;
      values[i] = signed
        ? { num: r.s32(o), den: r.s32(o + 4) }
        : { num: r.u32(o), den: r.u32(o + 4) };
    }
    return { kind: "rational", values };
  };

  switch (type) {
    case TiffType.ASCII:
      return { kind: "ascii", text: r.ascii(at, n) };
    case TiffType.BYTE:
      return ints(1, (o) => r.u8(o));
    case TiffType.SBYTE:
      return ints(1, (o) => r.s8(o));
    case TiffType.SHORT:
      return ints(2, (o) => r.u16(o));
    case TiffType.SSHORT:
      return ints(2, (o) => r.s16(o));
    case TiffType.LONG:
    case TiffType.IFD:
      return ints(4, (o) => r.u32(o));
    case TiffType.SLONG:
      return ints(4, (o) => r.s32(o));
    case TiffType.RATIONAL:
      return rationals(false);
    case TiffType.SRATIONAL:
      return rationals(true);
    case TiffType.FLOAT: {
      const values = new Array<number>(n);
      for (let i = 0; i < n; i++) values[i] = r.f32(at + i * 4);
      return { kind: "float", values };
    }
    case TiffType.DOUBLE: {
      const values = new Array<number>(n);
      for (let i = 0; i < n; i++) values[i] = r.f64(at + i * 8);
      return { kind: "float", values };
    }
    default:
      return { kind: "bytes", bytes: r.bytes(at, n) };
  }
}

/** Parse a TIFF header ("II*\0" / "MM\0*"); sets the reader's byte order and returns IFD0's offset. */
export function readTiffHeader(reader: ByteReader): number {
  if (reader.startsWith(0, "II")) reader.littleEndian = true;
  else if (reader.startsWith(0, "MM")) reader.littleEndian = false;
  else throw new RangeError("Missing TIFF byte-order mark");
  if (reader.u16(2) !== 42) throw new RangeError("Bad TIFF magic number");
  return reader.u32(4);
}

// ---- value helpers -------------------------------------------------------

export function entryText(entry: IfdEntry | undefined): string | undefined {
  if (!entry) return undefined;
  if (entry.value.kind === "ascii") return entry.value.text;
  if (entry.value.kind === "bytes") {
    let s = "";
    for (const b of entry.value.bytes) {
      if (b === 0) break;
      s += String.fromCharCode(b);
    }
    return s;
  }
  return undefined;
}

/** Numeric values of an entry; rationals become num/den (NaN when den is 0). */
export function entryNumbers(entry: IfdEntry | undefined): number[] | undefined {
  if (!entry) return undefined;
  switch (entry.value.kind) {
    case "int":
    case "float":
      return entry.value.values;
    case "rational":
      return entry.value.values.map((v) => (v.den === 0 ? NaN : v.num / v.den));
    default:
      return undefined;
  }
}

export function entryNumber(entry: IfdEntry | undefined): number | undefined {
  const values = entryNumbers(entry);
  return values && values.length > 0 && !Number.isNaN(values[0]) ? values[0] : undefined;
}
