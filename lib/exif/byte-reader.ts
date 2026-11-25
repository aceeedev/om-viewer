/** Thrown when a read would fall outside the buffer. Callers treat it as corrupt data. */
export class OutOfBoundsError extends Error {
  constructor(offset: number, length: number, size: number) {
    super(`Read of ${length} byte(s) at ${offset} is outside buffer of ${size} byte(s)`);
    this.name = "OutOfBoundsError";
  }
}

/** Bounds-checked, endian-aware reader over a byte range. Offsets are relative to the view. */
export class ByteReader {
  readonly view: DataView;
  littleEndian: boolean;

  constructor(view: DataView, littleEndian = false) {
    this.view = view;
    this.littleEndian = littleEndian;
  }

  static from(bytes: ArrayBuffer | Uint8Array, littleEndian = false): ByteReader {
    const view =
      bytes instanceof Uint8Array
        ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        : new DataView(bytes);
    return new ByteReader(view, littleEndian);
  }

  get length(): number {
    return this.view.byteLength;
  }

  /** True if `length` bytes starting at `offset` are inside the buffer. */
  has(offset: number, length: number): boolean {
    return Number.isInteger(offset) && offset >= 0 && length >= 0 && offset + length <= this.length;
  }

  private check(offset: number, length: number): void {
    if (!this.has(offset, length)) throw new OutOfBoundsError(offset, length, this.length);
  }

  /** A new reader over a sub-range with the same byte order. */
  sub(offset: number, length: number): ByteReader {
    this.check(offset, length);
    return new ByteReader(
      new DataView(this.view.buffer, this.view.byteOffset + offset, length),
      this.littleEndian,
    );
  }

  bytes(offset: number, length: number): Uint8Array {
    this.check(offset, length);
    return new Uint8Array(this.view.buffer, this.view.byteOffset + offset, length);
  }

  u8(offset: number): number {
    this.check(offset, 1);
    return this.view.getUint8(offset);
  }

  s8(offset: number): number {
    this.check(offset, 1);
    return this.view.getInt8(offset);
  }

  u16(offset: number): number {
    this.check(offset, 2);
    return this.view.getUint16(offset, this.littleEndian);
  }

  s16(offset: number): number {
    this.check(offset, 2);
    return this.view.getInt16(offset, this.littleEndian);
  }

  u32(offset: number): number {
    this.check(offset, 4);
    return this.view.getUint32(offset, this.littleEndian);
  }

  s32(offset: number): number {
    this.check(offset, 4);
    return this.view.getInt32(offset, this.littleEndian);
  }

  f32(offset: number): number {
    this.check(offset, 4);
    return this.view.getFloat32(offset, this.littleEndian);
  }

  f64(offset: number): number {
    this.check(offset, 8);
    return this.view.getFloat64(offset, this.littleEndian);
  }

  /** Latin-1 decode of `length` bytes, cut at the first NUL. */
  ascii(offset: number, length: number): string {
    const raw = this.bytes(offset, length);
    let end = raw.indexOf(0);
    if (end === -1) end = raw.length;
    let out = "";
    for (let i = 0; i < end; i++) out += String.fromCharCode(raw[i]);
    return out;
  }

  /** True if the bytes at `offset` equal `signature` (a Latin-1 string). */
  startsWith(offset: number, signature: string): boolean {
    if (!this.has(offset, signature.length)) return false;
    for (let i = 0; i < signature.length; i++) {
      if (this.view.getUint8(offset + i) !== signature.charCodeAt(i)) return false;
    }
    return true;
  }
}
