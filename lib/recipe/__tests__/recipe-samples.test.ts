/**
 * Checks the decoded recipe against exiftool's printed (labeled) values for each photo in
 * `samples/`. Skipped when exiftool isn't installed or there are no samples.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { readPhotoMetadata } from "@/lib/exif";
import { buildRecipe, type Profile, type Ranged, type Recipe, type ToneLevels } from "@/lib/recipe";
import {
  exiftoolSection,
  runExiftool,
  SAMPLES_DIR,
  sampleFiles,
  samplesRunnable,
} from "@/lib/test-utils/samples";

/** Parse ExifTool's "0 (min -2, max 2)" print format. */
function parseRanged(text: string): Ranged {
  const m = /^(-?\d+) \(min (-?\d+), max (-?\d+)\)$/.exec(text);
  if (!m) throw new Error(`unexpected ranged value: ${text}`);
  return { value: Number(m[1]), min: Number(m[2]), max: Number(m[3]) };
}

/** Parse ExifTool's ToneLevel print: "Highlights; 4; -7; 7; Shadows; ...". */
function parseToneLevel(text: string): ToneLevels {
  const parts = text.split("; ");
  const tone: ToneLevels = {};
  for (let i = 0; i + 3 < parts.length; i += 4) {
    const key = ({ Highlights: "highlights", Shadows: "shadows", Midtones: "midtones" } as const)[
      parts[i] as "Highlights" | "Shadows" | "Midtones"
    ];
    if (key) tone[key] = { value: Number(parts[i + 1]), min: Number(parts[i + 2]), max: Number(parts[i + 3]) };
  }
  return tone;
}

/** Tag 0x0502: ExifTool 13.60 and later call it WhiteBalanceFineTune; earlier versions, WhiteBalanceBracket. */
const FINE_TUNE_NAMES = ["WhiteBalanceFineTune", "WhiteBalanceBracket"];

function expectedKind(label: string): Profile["kind"] {
  if (label.startsWith("Color Profile")) return "colorProfile";
  if (label.startsWith("Monochrome Profile")) return "monochromeProfile";
  if (label === "Color Creator") return "colorCreator";
  if (label === "Monotone" || label === "Sepia") return "monotone";
  if (label === "Art Mode") return "art";
  return "standard";
}

describe.skipIf(!samplesRunnable)("recipe matches exiftool labels", () => {
  // Printed values (no -n), with tag IDs (-D) and group-1 prefixes.
  const exiftool = runExiftool(["-a", "-u", "-D", "-G1", "-MakerNotes:all"]);

  describe.each(sampleFiles)("%s", (file) => {
    let recipe: Recipe;
    let section: ReturnType<typeof exiftoolSection>;
    const printed = (name: string): string => printedAny([name]);
    /** The value of whichever of these tag names this exiftool version uses. */
    const printedAny = (names: string[]): string => {
      const tag = section.find((t) => names.some((name) => t.key === `Olympus:${name}`));
      if (!tag) throw new Error(`exiftool reported none of ${names.join(", ")}`);
      return String(tag.val);
    };

    beforeAll(async () => {
      const result = await readPhotoMetadata(new Blob([readFileSync(path.join(SAMPLES_DIR, file))]));
      if (!result.ok) throw new Error(`${file}: ${result.error.message}`);
      recipe = buildRecipe(result.metadata);
      section = exiftoolSection(exiftool.get(file)!, "Olympus:CameraSettingsVersion");
    });

    it("picture mode and profile kind", () => {
      const label = printed("PictureMode").split("; ")[0];
      expect(recipe.profile.mode.label).toBe(label);
      expect(recipe.profile.kind).toBe(expectedKind(label));
      const slot = /(\d)$/.exec(label)?.[1];
      expect(recipe.profile.mode.slot).toBe(slot === undefined ? undefined : Number(slot));
    });

    it("profile controls", () => {
      const p = recipe.profile;
      if (p.kind !== "art" && p.kind !== "unknown") {
        expect(p.contrast).toEqual(parseRanged(printed("PictureModeContrast")));
        expect(p.sharpness).toEqual(parseRanged(printed("PictureModeSharpness")));
      }

      switch (p.kind) {
        case "colorProfile": {
          const parts = printed("ColorProfileSettings").split("; ");
          expect(p.hues).toHaveLength(12);
          expect(parts.slice(0, 2)).toEqual([`Min ${p.hues[0].min}`, `Max ${p.hues[0].max}`]);
          expect(p.hues.map((h) => `${h.hue} ${h.value}`)).toEqual(parts.slice(2));
          expect(p.shading?.value).toBe(Number(printed("MonochromeVignetting")));
          expect(p.shading?.unverified).toBeTruthy();
          break;
        }
        case "monochromeProfile": {
          const parts = printed("MonochromeProfileSettings").split("; ");
          expect(p.filter?.label).toBe(parts[0]);
          expect(`Strength ${p.filterStrength?.value}`).toBe(parts[3]);
          expect([p.filterStrength?.min, p.filterStrength?.max]).toEqual([Number(parts[4]), Number(parts[5])]);
          expect(p.filmGrain?.label).toBe(printed("FilmGrainEffect"));
          expect(p.toning?.label).toBe(printed("MonochromeColor"));
          expect(p.shading?.value).toBe(Number(printed("MonochromeVignetting")));
          break;
        }
        case "colorCreator": {
          const parts = printed("ColorCreatorEffect").split("; ");
          expect(`Color ${p.color?.value}`).toBe(parts[0]);
          expect(`Strength ${p.strength?.value}`).toBe(parts[3]);
          break;
        }
        case "standard": {
          expect(p.saturation).toEqual(parseRanged(printed("PictureModeSaturation")));
          expect(`${p.gradation?.label}; ${p.gradation?.selection}`).toBe(printed("Gradation"));
          if (p.mode.label === "i-Enhance") expect(p.effect?.label).toBe(printed("PictureModeEffect"));
          else expect(p.effect).toBeUndefined();
          break;
        }
        case "monotone": {
          expect(p.bwFilter?.label).toBe(printed("PictureModeBWFilter"));
          expect(p.pictureTone?.label).toBe(printed("PictureModeTone"));
          break;
        }
        case "art": {
          expect(p.filter?.label).toBe(printed("ArtFilter").split("; ")[0]);
          break;
        }
        case "unknown":
          throw new Error(`unexpected unknown profile for ${p.mode.label}`);
      }
    });

    it("highlight & shadow tone", () => {
      expect(recipe.tone).toEqual(parseToneLevel(printed("ToneLevel")));
    });

    it("white balance", () => {
      const wb = recipe.whiteBalance;
      expect(wb.mode?.label).toBe(printed("WhiteBalance2"));
      const temperature = printed("WhiteBalanceTemperature");
      expect(wb.temperature).toBe(temperature === "Auto" ? undefined : Number(temperature));
      const keepWarmColor: Record<string, boolean> = { Auto: true, "Auto (Keep Warm Color Off)": false };
      expect(wb.keepWarmColor).toBe(keepWarmColor[printed("WhiteBalance2")]);
      const fineTune = wb.fineTune && `${wb.fineTune.amber.value} ${wb.fineTune.green.value}`;
      expect(fineTune).toBe(printedAny(FINE_TUNE_NAMES));
    });

    it("processing", () => {
      const pr = recipe.processing;
      expect(pr.colorSpace?.label).toBe(printed("ColorSpace"));
      expect(pr.noiseFilter?.label).toBe(printed("NoiseFilter"));
      expect(pr.noiseReduction?.length ? pr.noiseReduction.join(", ") : "(none)").toBe(printed("NoiseReduction"));
      expect(`${pr.gradation?.label}; ${pr.gradation?.selection}`).toBe(printed("Gradation"));
      expect(pr.distortionCorrection ? "On" : "Off").toBe(printed("DistortionCorrection"));
      expect(pr.shadingCompensation ? "On" : "Off").toBe(printed("ShadingCompensation"));
      expect(pr.customSaturation).toEqual(parseRanged(printed("CustomSaturation")));
      expect(pr.contrastSetting).toEqual(parseRanged(printed("ContrastSetting")));
      expect(pr.sharpnessSetting).toEqual(parseRanged(printed("SharpnessSetting")));
    });

    it("raw table names agree with exiftool", () => {
      expect(recipe.raw.length).toBeGreaterThan(50);
      // Skip exiftool's decoded sub-structures (AF/subject-detect info), whose IDs restart at 0.
      const topLevel = section.filter((t) => t.id >= 0x0100);
      for (const tag of topLevel) {
        const ours = recipe.raw.find((r) => r.tag === tag.id);
        expect(ours, `raw entry for ${tag.key}`).toBeDefined();
        const theirName = tag.key.replace(/^Olympus:/, "");
        if (theirName.startsWith("Olympus_CameraSettings_")) expect(ours?.name, theirName).toBeUndefined();
        else if (FINE_TUNE_NAMES.includes(theirName)) expect(ours?.name).toBe("WhiteBalanceFineTune");
        else expect(ours?.name, `name of ${ours?.id}`).toBe(theirName);
      }
    });
  });
});
