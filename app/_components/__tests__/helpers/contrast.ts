/**
 * WCAG 2 contrast, for checking the text on the Simple view's camera screens. Test-only, and no
 * packages: the formulas are short.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

/** An sRGB color, 0–255 per channel. */
export type Rgb = [r: number, g: number, b: number];

export const WHITE: Rgb = [255, 255, 255];

export function hex(value: string): Rgb {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value);
  if (!m) throw new Error(`not a #rrggbb color: ${value}`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/** The screens' background: --color-screen in globals.css. */
export const SCREEN_BACKGROUND = hex(
  /--color-screen:\s*(#[0-9a-f]{6})/i.exec(readFileSync(path.join(import.meta.dirname, "../../../globals.css"), "utf8"))![1],
);

/** `color` at `alpha` over `background`, blended in sRGB as browsers do. */
export function over(color: Rgb, alpha: number, background: Rgb): Rgb {
  return color.map((c, i) => c * alpha + background[i] * (1 - alpha)) as Rgb;
}

/** WCAG relative luminance. */
function luminance(color: Rgb): number {
  const [r, g, b] = color.map((c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, from 1 (none) to 21 (black on white). */
export function contrast(a: Rgb, b: Rgb): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

const tailwindTheme = readFileSync(createRequire(import.meta.url).resolve("tailwindcss/theme.css"), "utf8");

/**
 * A Tailwind color by name, e.g. "amber-400". Tailwind defines them in OKLCH, converted here to
 * sRGB (clipped to it, as on an ordinary screen) with Björn Ottosson's OKLab matrices.
 */
export function themeColor(name: string): Rgb {
  const m = new RegExp(`--color-${name}:\\s*oklch\\(([\\d.]+)% ([\\d.]+) ([\\d.]+)\\)`).exec(tailwindTheme);
  if (!m) throw new Error(`no Tailwind color ${name}`);
  const [l, c, h] = [Number(m[1]) / 100, Number(m[2]), (Number(m[3]) * Math.PI) / 180];
  const [a, b] = [c * Math.cos(h), c * Math.sin(h)];
  const lms = [
    l + 0.3963377774 * a + 0.2158037573 * b,
    l - 0.1055613458 * a - 0.0638541728 * b,
    l - 0.0894841775 * a - 1.291485548 * b,
  ].map((v) => v ** 3);
  const linear = [
    4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
    -1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
    -0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
  ];
  return linear.map((v) => {
    const x = Math.min(1, Math.max(0, v));
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
  }) as Rgb;
}
