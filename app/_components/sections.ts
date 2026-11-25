/**
 * Turns a Recipe into titled sections of display rows. Shared by the Simple and Full views so
 * both always describe a setting the same way. Pure functions, no React.
 */
import type { Choice, Gradation, PictureMode, Profile, Ranged, Recipe, ToneLevels, WhiteBalance } from "@/lib/recipe";
import * as fmt from "./format";

export interface Row {
  label: string;
  value: string;
  /** The camera's range for this setting, e.g. "−5 to +5". */
  range?: string;
  /** Why this value's meaning is uncertain; shown under it. */
  unverified?: string;
  /** CSS color for a small swatch next to the label (Color Profile hues). */
  swatch?: string;
}

export interface Section {
  title: string;
  rows: Row[];
}

/**
 * Display colors for the 12 Color Profile Control hues. Our own palette, picked in OKLCH so the
 * hues read as evenly bright as each name allows (yellow stays light, violet and blue deep).
 */
export const HUE_SWATCHES: Record<string, string> = {
  Yellow: "#fbe405", // oklch(0.91 0.19 102)
  Orange: "#ffa839", // oklch(0.80 0.156 68)
  "Orange-red": "#fa5f29", // oklch(0.68 0.20 38)
  Red: "#eb3062", // oklch(0.62 0.22 12)
  Magenta: "#d227b0", // oklch(0.60 0.24 338)
  Violet: "#8e3de8", // oklch(0.56 0.24 300)
  Blue: "#3a66ed", // oklch(0.56 0.21 266)
  "Blue-cyan": "#339fee", // oklch(0.68 0.15 245)
  Cyan: "#50d9ef", // oklch(0.82 0.12 210)
  "Green-cyan": "#15e5b4", // oklch(0.82 0.16 170)
  Green: "#59de65", // oklch(0.80 0.20 145)
  "Yellow-green": "#baed3f", // oklch(0.88 0.20 125)
};

function ranged(label: string, r: Ranged | undefined): Row | undefined {
  if (!r) return undefined;
  return {
    label,
    value: fmt.rangedValue(r.value, r.min),
    range: fmt.rangeText(r.min, r.max),
    unverified: r.unverified,
  };
}

function choice(label: string, c: Choice | undefined): Row | undefined {
  return c ? { label, value: c.label } : undefined;
}

function gradation(g: Gradation | undefined): Row | undefined {
  if (!g) return undefined;
  return { label: "Gradation", value: g.selection === "Auto-Override" ? `${g.label} (auto-override)` : g.label };
}

const rows = (...items: (Row | undefined)[]): Row[] => items.filter((r): r is Row => r !== undefined);

/**
 * The white balance mode as a name and its details, e.g. "Auto" with "Keep Warm Color On" (the
 * Off mode's label already says so), "7500K" with "Fine Weather with Shade", or "Custom WB 1"
 * with a temperature the label doesn't already give ("5800K").
 */
export function whiteBalanceMode(wb: WhiteBalance): { name: string; details: string[] } | undefined {
  if (!wb.mode) return undefined;
  const { label } = wb.mode;
  // Labels carry their detail in parentheses: "7500K (Fine Weather with Shade)".
  const m = /^(.*?) \((.*)\)$/.exec(label);
  const name = m ? m[1] : label;
  const details = m ? [m[2]] : [];
  if (wb.keepWarmColor && label === "Auto") details.push("Keep Warm Color On");
  if (wb.temperature && !label.includes(`${wb.temperature}K`)) details.push(`${wb.temperature}K`);
  return { name, details };
}

/**
 * Picture modes the PEN's manual names differently from ExifTool, whose names the recipe keeps so
 * it can be checked against ExifTool's output.
 */
const MANUAL_MODE_NAMES: Record<number, string> = {
  256: "Monochrome", // ExifTool's "Monotone"
};

/** The picture mode as the camera's manual names it: "Monochrome" where ExifTool says "Monotone". */
export function pictureModeName(mode: PictureMode): string {
  return MANUAL_MODE_NAMES[mode.id] ?? mode.label;
}

/** The controls the shot's picture mode lets you edit, grouped as on the camera. */
export function profileSections(profile: Profile): Section[] {
  const picture = (extra: (Row | undefined)[] = []): Section => ({
    title: "Picture settings",
    rows: rows(
      ...extra,
      "contrast" in profile ? ranged("Contrast", profile.contrast) : undefined,
      "sharpness" in profile ? ranged("Sharpness", profile.sharpness) : undefined,
    ),
  });

  switch (profile.kind) {
    case "colorProfile":
      return [
        {
          title: "Color Profile Control",
          rows: rows(
            ...profile.hues.map((h) => ({
              label: h.hue,
              value: fmt.rangedValue(h.value, h.min),
              range: fmt.rangeText(h.min, h.max),
              swatch: HUE_SWATCHES[h.hue],
            })),
            ranged("Shading", profile.shading),
          ),
        },
        picture(),
      ];
    case "monochromeProfile":
      return [
        {
          title: "Monochrome Profile Control",
          rows: rows(
            choice("Color filter", profile.filter),
            ranged("Filter strength", profile.filterStrength),
            choice("Film grain", profile.filmGrain),
            ranged("Shading", profile.shading),
            choice("Toning", profile.toning),
          ),
        },
        picture(),
      ];
    case "colorCreator":
      return [
        {
          title: "Color Creator",
          rows: rows(ranged("Color", profile.color), ranged("Strength", profile.strength)),
        },
        picture(),
      ];
    case "standard":
      return [
        {
          title: "Picture settings",
          rows: rows(
            ranged("Saturation", profile.saturation),
            ranged("Contrast", profile.contrast),
            ranged("Sharpness", profile.sharpness),
            gradation(profile.gradation),
            profile.effect ? { label: "Effect", value: profile.effect.label } : undefined,
          ),
        },
      ];
    case "monotone":
      return [
        picture([
          choice("B&W filter", profile.bwFilter),
          choice("Picture tone", profile.pictureTone),
        ]),
        { title: "Tone", rows: rows(gradation(profile.gradation)) },
      ].filter((s) => s.rows.length > 0);
    case "art":
      return [
        { title: "Art filter", rows: rows(choice("Filter", profile.filter), choice("Effect", profile.effect)) },
      ];
    case "unknown":
      return [];
  }
}

export function toneSection(tone: ToneLevels): Section {
  return {
    title: "Highlight & Shadow",
    rows: rows(
      ranged("Highlights", tone.highlights),
      ranged("Shadows", tone.shadows),
      ranged("Midtones", tone.midtones),
    ),
  };
}

/** Every section for the Full view, except the raw maker-note table. */
export function fullSections(recipe: Recipe): Section[] {
  const { profile, whiteBalance: wb, processing: pr, exposure: ex, camera, lens } = recipe;
  const profileHasGradation = profile.kind === "standard" || profile.kind === "monotone";

  const sections: Section[] = [
    {
      title: "Picture mode",
      rows: [{ label: "Mode", value: pictureModeName(profile.mode) }],
    },
    ...profileSections(profile),
    toneSection(recipe.tone),
    {
      title: "White balance",
      rows: rows(
        choice("Mode", wb.mode),
        wb.keepWarmColor === undefined ? undefined : { label: "Keep Warm Color", value: fmt.onOff(wb.keepWarmColor) },
        { label: "Color temperature", value: wb.temperature ? `${wb.temperature} K` : "Auto" },
        ranged("Fine-tune, amber (+) / blue (−)", wb.fineTune?.amber),
        ranged("Fine-tune, green (+) / magenta (−)", wb.fineTune?.green),
      ),
    },
    {
      title: "Processing",
      rows: rows(
        choice("Color space", pr.colorSpace),
        pr.noiseFilter ? { label: "Noise filter", value: pr.noiseFilter.label } : undefined,
        pr.noiseReduction
          ? { label: "Noise reduction", value: pr.noiseReduction.length ? pr.noiseReduction.join(", ") : "None" }
          : undefined,
        profileHasGradation ? undefined : gradation(pr.gradation),
        pr.distortionCorrection === undefined
          ? undefined
          : { label: "Distortion correction", value: fmt.onOff(pr.distortionCorrection) },
        pr.shadingCompensation === undefined
          ? undefined
          : { label: "Lens shading compensation", value: fmt.onOff(pr.shadingCompensation) },
        ranged("Saturation (−5 to +5 copy)", pr.customSaturation),
        ranged("Contrast (−5 to +5 copy)", pr.contrastSetting),
        ranged("Sharpness (−5 to +5 copy)", pr.sharpnessSetting),
      ),
    },
    {
      title: "Exposure",
      rows: rows(
        ex.exposureTime === undefined ? undefined : { label: "Shutter speed", value: fmt.shutterSpeed(ex.exposureTime) },
        ex.fNumber === undefined ? undefined : { label: "Aperture", value: fmt.aperture(ex.fNumber) },
        ex.iso === undefined ? undefined : { label: "ISO", value: String(ex.iso) },
        ex.focalLength === undefined ? undefined : { label: "Focal length", value: fmt.focalLength(ex.focalLength) },
        ex.exposureCompensation === undefined
          ? undefined
          : { label: "Exposure compensation", value: fmt.exposureCompensation(ex.exposureCompensation) },
        ex.dateTimeOriginal === undefined
          ? undefined
          : { label: "Taken", value: fmt.dateTime(ex.dateTimeOriginal, ex.offsetTimeOriginal) },
      ),
    },
    {
      title: "Camera & lens",
      rows: rows(
        camera.make ? { label: "Make", value: camera.make } : undefined,
        camera.model ? { label: "Model", value: camera.model } : undefined,
        camera.firmware ? { label: "Firmware", value: camera.firmware } : undefined,
        camera.cameraType ? { label: "Camera type code", value: camera.cameraType } : undefined,
        lens.model ? { label: "Lens", value: lens.model } : undefined,
      ),
    },
  ];
  return sections.filter((s) => s.rows.length > 0);
}

/** One-line shooting summary, e.g. "1/250 s · f/4 · ISO 200 · 20 mm". */
export function exposureSummary(recipe: Recipe): string {
  const ex = recipe.exposure;
  return [
    ex.exposureTime === undefined ? undefined : fmt.shutterSpeed(ex.exposureTime),
    ex.fNumber === undefined ? undefined : fmt.aperture(ex.fNumber),
    ex.iso === undefined ? undefined : `ISO ${ex.iso}`,
    ex.focalLength === undefined ? undefined : fmt.focalLength(ex.focalLength),
  ]
    .filter(Boolean)
    .join(" · ");
}
