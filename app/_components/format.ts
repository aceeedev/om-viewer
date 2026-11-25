/** Display formatting for recipe values. Pure functions, no React. */

const MINUS = "−";

/** "+4", "0", "−2" (true minus sign). */
export function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `${MINUS}${Math.abs(n)}`;
  return "0";
}

/** "+4", "±0", "−2": as the camera prints a level, with ±0 for zero (e.g. "Mid ±0"). */
export function level(n: number): string {
  return n === 0 ? "±0" : signed(n);
}

/** "+0.3", "±0.0", "−1.0": exposure compensation as the camera prints it, to one decimal. */
export function evLevel(ev: number): string {
  const r = round(ev, 1);
  const sign = r > 0 ? "+" : r < 0 ? MINUS : "±";
  return `${sign}${Math.abs(r).toFixed(1)}`;
}

/** "4", "0", "−1": like signed() without the plus sign, for compact labels. */
export function plain(n: number): string {
  return n < 0 ? `${MINUS}${Math.abs(n)}` : String(n || 0);
}

/**
 * White balance fine-tune as the camera prints it, "A2.M2": each axis's letter says which way it
 * shifts (A amber or B blue, G green or M magenta), then how many steps.
 */
export function fineTune(amber: number, green: number): string {
  return `${amber < 0 ? "B" : "A"}${Math.abs(amber)}.${green < 0 ? "M" : "G"}${Math.abs(green)}`;
}

/** The same in words, for screen readers: "amber 4, green 0", "blue 3, magenta 2". */
export function fineTuneWords(amber: number, green: number): string {
  return `${amber < 0 ? "blue" : "amber"} ${Math.abs(amber)}, ${green < 0 ? "magenta" : "green"} ${Math.abs(green)}`;
}

/** "−5 to +5"; non-negative ranges drop the plus signs ("0 to 3"). */
export function rangeText(min: number, max: number): string {
  const f = min >= 0 ? String : signed;
  return `${f(min)} to ${f(max)}`;
}

/** A value on its range: as the camera prints a level ("+2", "±0", "−1") when the range goes negative. */
export function rangedValue(value: number, min: number): string {
  return min >= 0 ? String(value) : level(value);
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

/** "±0.0 EV", "+0.3 EV", "−0.7 EV": the camera's way (evLevel) with the unit. */
export function exposureCompensation(ev: number): string {
  return `${evLevel(ev)} EV`;
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
