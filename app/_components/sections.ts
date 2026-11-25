/**
 * Turns a Recipe into titled sections of display rows. Shared by the Simple and Full views so
 * both always describe a setting the same way. Pure functions, no React.
 */
import type { Choice, Gradation, Profile, Ranged, Recipe, ToneLevels } from "@/lib/recipe";
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

/** Approximate display colors for the 12 Color Profile Control hues. */
export const HUE_SWATCHES: Record<string, string> = {
  Yellow: "#f2d21b",
  Orange: "#f59e0b",
  "Orange-red": "#f0642a",
  Red: "#e0303a",
  Magenta: "#d4338b",
  Violet: "#8b5cf6",
  Blue: "#3b6ff6",
  "Blue-cyan": "#0ea5e9",
  Cyan: "#06b6d4",
  "Green-cyan": "#14b8a6",
  Green: "#22c55e",
  "Yellow-green": "#a3d635",
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

export interface ProfileSectionOptions {
  /** Simple view: hide settings that have no effect in the current state (e.g. strength with no filter). */
  simple?: boolean;
}

/** The controls the shot's picture mode lets you edit, grouped as on the camera. */
export function profileSections(profile: Profile, options: ProfileSectionOptions = {}): Section[] {
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
    case "monochromeProfile": {
      const hasFilter = profile.filter !== undefined && profile.filter.id !== 0;
      return [
        {
          title: "Monochrome Profile Control",
          rows: rows(
            choice("Color filter", profile.filter),
            options.simple && !hasFilter ? undefined : ranged("Filter strength", profile.filterStrength),
            choice("Film grain", profile.filmGrain),
            ranged("Shading", profile.shading),
            choice("Toning", profile.toning),
          ),
        },
        picture(),
      ];
    }
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
      rows: [{ label: "Mode", value: profile.mode.label }],
    },
    ...profileSections(profile),
    toneSection(recipe.tone),
    {
      title: "White balance",
      rows: rows(
        choice("Mode", wb.mode),
        { label: "Color temperature", value: wb.temperature ? `${wb.temperature} K` : "Auto" },
        wb.bracket
          ? { label: "Tag 0x0502", value: wb.bracket.values.join(" "), unverified: wb.bracket.unverified }
          : undefined,
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
