/**
 * Tiny TIFF/EXIF/maker-note writer for tests, so parser tests don't depend on real photos.
 */

export type Field =
  | { tag: number; type: "ascii"; value: string }
  | { tag: number; type: "u8" | "u16" | "s16" | "u32" | "s32"; value: number[] }
  | { tag: number; type: "rational" | "srational"; value: [number, number][] }
  | { tag: number; type: "undefined"; value: Uint8Array }
  /**
   * A sub-IFD. `as` picks the encoding: "ifd" (type 13 pointer, default), "long" (type 4
   * pointer) or "embedded" (type 7 blob holding the IFD; inner offsets share the parent base).
   */
  | { tag: number; type: "ifd"; value: Field[]; as?: "ifd" | "long" | "embedded" };

const TYPE_CODE = {
  u8: 1, ascii: 2, u16: 3, u32: 4, rational: 5, undefined: 7, s16: 8, s32: 9, srational: 10,
} as const;

class Writer {
  private buf: number[] = [];
  readonly le: boolean;

  constructor(le: boolean) {
    this.le = le;
  }

  get length(): number {
    return this.buf.length;
  }

  bytes(data: ArrayLike<number>): void {
    for (let i = 0; i < data.length; i++) this.buf.push(data[i] & 0xff);
  }

  text(s: string): void {
    for (let i = 0; i < s.length; i++) this.buf.push(s.charCodeAt(i));
  }

  u16(v: number): void {
    this.bytes(encodeInt(v, 2, this.le));
  }

  u32(v: number): void {
    this.bytes(encodeInt(v, 4, this.le));
  }

  setBytes(pos: number, data: ArrayLike<number>): void {
    for (let i = 0; i < data.length; i++) this.buf[pos + i] = data[i] & 0xff;
  }

  setU16(pos: number, v: number): void {
    this.setBytes(pos, encodeInt(v, 2, this.le));
  }

  setU32(pos: number, v: number): void {
    this.setBytes(pos, encodeInt(v, 4, this.le));
  }

  align(): void {
    if (this.buf.length % 2) this.buf.push(0);
  }

  toUint8Array(): Uint8Array<ArrayBuffer> {
    return Uint8Array.from(this.buf);
  }
}

function encodeInt(v: number, size: 1 | 2 | 4, le: boolean): number[] {
  const out: number[] = [];
  const u = size === 4 ? v >>> 0 : v & (size === 2 ? 0xffff : 0xff);
  for (let i = 0; i < size; i++) out.push((u >>> (8 * i)) & 0xff);
  return le ? out : out.reverse();
}

function encodeField(f: Exclude<Field, { type: "ifd" }>, le: boolean): { type: number; count: number; data: number[] } {
  switch (f.type) {
    case "ascii": {
      const data = [...f.value].map((c) => c.charCodeAt(0));
      data.push(0);
      return { type: TYPE_CODE.ascii, count: data.length, data };
    }
    case "undefined":
      return { type: TYPE_CODE.undefined, count: f.value.length, data: [...f.value] };
    case "u8":
      return { type: TYPE_CODE.u8, count: f.value.length, data: f.value.flatMap((v) => encodeInt(v, 1, le)) };
    case "u16":
    case "s16":
      return { type: TYPE_CODE[f.type], count: f.value.length, data: f.value.flatMap((v) => encodeInt(v, 2, le)) };
    case "u32":
    case "s32":
      return { type: TYPE_CODE[f.type], count: f.value.length, data: f.value.flatMap((v) => encodeInt(v, 4, le)) };
    case "rational":
    case "srational":
      return {
        type: TYPE_CODE[f.type],
        count: f.value.length,
        data: f.value.flatMap(([n, d]) => [...encodeInt(n, 4, le), ...encodeInt(d, 4, le)]),
      };
  }
}

/** Write an IFD (plus its out-of-line data and sub-IFDs). Offsets are written relative to `base`. */
function writeIfd(w: Writer, fields: Field[], base: number): number {
  w.align();
  const start = w.length;
  const sorted = [...fields].sort((a, b) => a.tag - b.tag);
  w.u16(sorted.length);
  const entryAt: number[] = [];
  for (const f of sorted) {
    entryAt.push(w.length);
    w.u16(f.tag);
    w.u16(0);
    w.u32(0);
    w.u32(0);
  }
  w.u32(0); // no next IFD

  sorted.forEach((f, i) => {
    const at = entryAt[i];
    if (f.type === "ifd") {
      const mode = f.as ?? "ifd";
      const subStart = writeIfd(w, f.value, base);
      if (mode === "embedded") {
        w.setU16(at + 2, TYPE_CODE.undefined);
        w.setU32(at + 4, w.length - subStart);
      } else {
        w.setU16(at + 2, mode === "long" ? TYPE_CODE.u32 : 13);
        w.setU32(at + 4, 1);
      }
      w.setU32(at + 8, subStart - base);
      return;
    }
    const { type, count, data } = encodeField(f, w.le);
    w.setU16(at + 2, type);
    w.setU32(at + 4, count);
    if (data.length <= 4) {
      w.setBytes(at + 8, data);
    } else {
      w.align();
      const pos = w.length;
      w.bytes(data);
      w.setU32(at + 8, pos - base);
    }
  });
  return start;
}

export function buildTiff(ifd0: Field[], le = true): Uint8Array<ArrayBuffer> {
  const w = new Writer(le);
  w.text(le ? "II" : "MM");
  w.u16(42);
  w.u32(8);
  writeIfd(w, ifd0, 0);
  return w.toUint8Array();
}

export function buildMakerNote(
  header: "OM SYSTEM" | "OLYMPUS",
  main: Field[],
  le = true,
  version = header === "OM SYSTEM" ? 4 : 3,
): Uint8Array<ArrayBuffer> {
  const w = new Writer(le);
  if (header === "OM SYSTEM") w.bytes([..."OM SYSTEM"].map((c) => c.charCodeAt(0)).concat([0, 0, 0]));
  else w.bytes([..."OLYMPUS"].map((c) => c.charCodeAt(0)).concat([0]));
  w.text(le ? "II" : "MM");
  w.u16(version);
  writeIfd(w, main, 0);
  return w.toUint8Array();
}

/** Wrap a TIFF payload in a JPEG: SOI, optional filler APPn segments, APP1 Exif, SOS, EOI. */
export function buildJpeg(tiff: Uint8Array | null, options: { fillerBytes?: number } = {}): Uint8Array<ArrayBuffer> {
  const out: number[] = [0xff, 0xd8];
  let filler = options.fillerBytes ?? 0;
  while (filler > 0) {
    const n = Math.min(filler, 65533);
    out.push(0xff, 0xe2, ((n + 2) >> 8) & 0xff, (n + 2) & 0xff);
    for (let i = 0; i < n; i++) out.push(0);
    filler -= n;
  }
  if (tiff) {
    const payloadLength = 6 + tiff.length + 2;
    out.push(0xff, 0xe1, (payloadLength >> 8) & 0xff, payloadLength & 0xff);
    out.push(0x45, 0x78, 0x69, 0x66, 0, 0); // "Exif\0\0"
    out.push(...tiff);
  }
  out.push(0xff, 0xda, 0x00, 0x02, 0xff, 0xd9);
  return Uint8Array.from(out);
}

const ascii = (s: string) => Uint8Array.from([...s].map((c) => c.charCodeAt(0)));

/** Representative CameraSettings for a Color Profile 1 shot (values taken from a real PEN). */
export const sampleCameraSettings: Field[] = [
  { tag: 0x0000, type: "undefined", value: ascii("0100") },
  { tag: 0x0500, type: "u16", value: [0] },
  { tag: 0x050d, type: "rational", value: [[27, 10]] },
  { tag: 0x050f, type: "s16", value: [0, -1, 1, 0] },
  { tag: 0x0520, type: "u16", value: [9, 2] },
  { tag: 0x0521, type: "s16", value: [0, -2, 2] },
  { tag: 0x0523, type: "s16", value: [-2, -2, 2] },
  { tag: 0x0524, type: "s16", value: [-1, -2, 2] },
  {
    tag: 0x052e,
    type: "s16",
    value: [-31999, 4, -7, 7, -31998, -4, -7, 7, -31997, 0, -7, 7, ...new Array(16).fill(0)],
  },
  { tag: 0x0532, type: "s16", value: [0, 0, 29, 0, -4, 3] },
  { tag: 0x0535, type: "srational", value: [[0, 0]] },
  { tag: 0x0537, type: "s16", value: [0, 0, 8, 2, 0, 3] },
  { tag: 0x0538, type: "u16", value: [3] },
  { tag: 0x0539, type: "s16", value: [-5, 5, 4, 4, 4, 4, 0, -1, 1, 4, 4, 4, 4, 1] },
  { tag: 0x053a, type: "s16", value: [-3] },
  { tag: 0x053b, type: "s16", value: [1] },
];

export const sampleEquipment: Field[] = [
  { tag: 0x0000, type: "undefined", value: ascii("0100") },
  { tag: 0x0100, type: "ascii", value: "S0131" },
  { tag: 0x0203, type: "ascii", value: "OM 14-42mm F3.5-5.6 III" },
];

export interface OmJpegOptions {
  header?: "OM SYSTEM" | "OLYMPUS";
  le?: boolean;
  subIfdAs?: "ifd" | "long" | "embedded";
  cameraSettings?: Field[];
  makerNote?: Uint8Array;
  fillerBytes?: number;
}

/** A complete synthetic OM System JPEG with IFD0, ExifIFD and an Olympus-style maker note. */
export function buildOmJpeg(options: OmJpegOptions = {}): Uint8Array<ArrayBuffer> {
  const { header = "OM SYSTEM", le = true, subIfdAs = "ifd" } = options;
  const makerNote =
    options.makerNote ??
    buildMakerNote(
      header,
      [
        { tag: 0x0209, type: "undefined", value: ascii("OM SYSTEM CAMERA") },
        { tag: 0x2010, type: "ifd", as: subIfdAs, value: sampleEquipment },
        { tag: 0x2020, type: "ifd", as: subIfdAs, value: options.cameraSettings ?? sampleCameraSettings },
      ],
      le,
    );

  const tiff = buildTiff(
    [
      { tag: 0x010f, type: "ascii", value: "OM Digital Solutions   " },
      { tag: 0x0110, type: "ascii", value: "PEN" },
      { tag: 0x0131, type: "ascii", value: "Version 1.0" },
      {
        tag: 0x8769,
        type: "ifd",
        as: "long",
        value: [
          { tag: 0x829a, type: "rational", value: [[1, 250]] },
          { tag: 0x829d, type: "rational", value: [[40, 10]] },
          { tag: 0x8827, type: "u16", value: [200] },
          { tag: 0x9003, type: "ascii", value: "2026:10:23 13:57:06" },
          { tag: 0x9011, type: "ascii", value: "-08:00" },
          { tag: 0x9204, type: "srational", value: [[-7, 10]] },
          { tag: 0x920a, type: "rational", value: [[20, 1]] },
          { tag: 0x927c, type: "undefined", value: makerNote },
          { tag: 0xa434, type: "ascii", value: "OM 14-42mm F3.5-5.6 III" },
        ],
      },
    ],
    le,
  );
  return buildJpeg(tiff, { fillerBytes: options.fillerBytes });
}
