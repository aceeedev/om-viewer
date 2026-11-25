/** Display formatting for recipe values. Pure functions, no React. */

const MINUS = "−";

/** "+4", "0", "−2" (true minus sign). */
export function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${MINUS}${Math.abs(n)}`;
  return "0";
}

/** "−5 to +5"; non-negative ranges drop the plus signs ("0 to 3"). */
export function rangeText(min: number, max: number): string {
  const f = min >= 0 ? String : signed;
  return `${f(min)} to ${f(max)}`;
}

/** A value on its range: signed when the range goes negative. */
export function rangedValue(value: number, min: number): string {
  return min >= 0 ? String(value) : signed(value);
}

/** "1/250 s", "0.3 s", "2 s". */
export function shutterSpeed(seconds: number): string {
  if (seconds <= 0) return `${seconds} s`;
  if (seconds < 1) {
    const denominator = 1 / seconds;
    if (Math.abs(denominator - Math.round(denominator)) < 0.01) return `1/${Math.round(denominator)} s`;
  }
  return `${round(seconds, 2)} s`;
}

export function aperture(fNumber: number): string {
  return `f/${round(fNumber, 1)}`;
}

export function focalLength(mm: number): string {
  return `${round(mm, 1)} mm`;
}

/** "0 EV", "+0.3 EV", "−0.7 EV". */
export function exposureCompensation(ev: number): string {
  const r = round(ev, 1);
  return `${r === 0 ? "0" : signed(r)} EV`;
}

/** EXIF "2026:10:23 13:57:06" + "-08:00" → "2026-10-23 13:57:06 (UTC−08:00)". */
export function dateTime(exif: string, offset?: string): string {
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(exif);
  const base = m ? `${m[1]}-${m[2]}-${m[3]} ${m[4]}` : exif;
  return offset ? `${base} (UTC${offset.replace("-", MINUS)})` : base;
}

export function onOff(value: boolean): string {
  return value ? "On" : "Off";
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
