import { describe, expect, it } from "vitest";
import { parseJpeg } from "@/lib/exif";
import { buildRecipe, UNVERIFIED, type Recipe } from "@/lib/recipe";
import { buildMakerNote, buildOmJpeg, sampleCameraSettings, type Field } from "@/lib/exif/__tests__/helpers/build-jpeg";

/** sampleCameraSettings with some tags replaced or added. */
function withSettings(overrides: Field[]): Field[] {
  const replaced = new Set(overrides.map((f) => f.tag));
  return [...sampleCameraSettings.filter((f) => !replaced.has(f.tag)), ...overrides];
}

function recipeFor(cameraSettings: Field[]): Recipe {
  const result = parseJpeg(buildOmJpeg({ cameraSettings }));
  if (!result.ok) throw new Error(result.error.message);
  return buildRecipe(result.metadata);
}

const mode = (id: number): Field => ({ tag: 0x0520, type: "u16", value: [id, 2] });

describe("buildRecipe on synthetic maker notes", () => {
  it("decodes a Color Profile with all 12 hues and flags shading as unverified", () => {
    const recipe = recipeFor(withSettings([mode(11)]));
    expect(recipe.profile).toMatchObject({
      kind: "colorProfile",
      mode: { id: 11, label: "Color Profile 3", slot: 3 },
      contrast: { value: -2, min: -2, max: 2 },
      shading: { value: -3, min: -5, max: 5, unverified: UNVERIFIED.colorProfileShading },
    });
    if (recipe.profile.kind !== "colorProfile") throw new Error("wrong kind");
    expect(recipe.profile.hues[0]).toEqual({ hue: "Yellow", value: 4, min: -5, max: 5 });
    expect(recipe.profile.hues[11]).toEqual({ hue: "Yellow-green", value: 1, min: -5, max: 5 });
  });

  it("decodes Monochrome Profile 4 with filter, strength, grain, shading and toning", () => {
    const recipe = recipeFor(
      withSettings([mode(18), { tag: 0x0537, type: "s16", value: [3, 0, 8, 1, 0, 3] }]),
    );
    expect(recipe.profile).toEqual({
      kind: "monochromeProfile",
      mode: { id: 18, label: "Monochrome Profile 4", slot: 4 },
      contrast: { value: -2, min: -2, max: 2 },
      sharpness: { value: -1, min: -2, max: 2 },
      filter: { id: 3, label: "Red Filter" },
      filterStrength: { value: 1, min: 0, max: 3 },
      filmGrain: { id: 3, label: "High" },
      shading: { value: -3, min: -5, max: 5 },
      toning: { id: 1, label: "Normal" },
    });
  });

  it("decodes Color Creator color and strength", () => {
    const recipe = recipeFor(
      withSettings([mode(7), { tag: 0x0532, type: "s16", value: [12, 0, 29, -2, -4, 3] }]),
    );
    expect(recipe.profile).toMatchObject({
      kind: "colorCreator",
      color: { value: 12, min: 0, max: 29 },
      strength: { value: -2, min: -4, max: 3 },
    });
  });

  it("decodes Monotone filter and tone", () => {
    const recipe = recipeFor(
      withSettings([
        mode(256),
        { tag: 0x0525, type: "s16", value: [4] },
        { tag: 0x0526, type: "s16", value: [2] },
      ]),
    );
    expect(recipe.profile).toMatchObject({
      kind: "monotone",
      bwFilter: { id: 4, label: "Red" },
      pictureTone: { id: 2, label: "Sepia" },
      gradation: { label: "Normal", selection: "User-Selected" },
    });
  });

  it("decodes Art Mode filter and effect", () => {
    const effect = new Array(20).fill(0);
    effect[4] = 0x8030;
    const recipe = recipeFor(
      withSettings([
        mode(17),
        { tag: 0x0529, type: "u16", value: [23, 0, 0, 0] },
        { tag: 0x052f, type: "u16", value: effect },
      ]),
    );
    expect(recipe.profile).toEqual({
      kind: "art",
      mode: { id: 17, label: "Art Mode" },
      filter: { id: 23, label: "Sparkle" },
      effect: { id: 0x8030, label: "Frame" },
    });
  });

  it("gives i-Enhance its effect and other standard modes none", () => {
    const effect: Field = { tag: 0x052d, type: "s16", value: [1, -1, 1] };
    const iEnhance = recipeFor(withSettings([mode(5), effect]));
    expect(iEnhance.profile).toMatchObject({
      kind: "standard",
      saturation: { value: 0, min: -2, max: 2 },
      effect: { value: 1, min: -1, max: 1, label: "High" },
    });
    const natural = recipeFor(withSettings([mode(2), effect]));
    expect(natural.profile).toMatchObject({ kind: "standard", effect: undefined });
  });

  it("decodes tone levels, white balance and processing", () => {
    const recipe = recipeFor(
      withSettings([
        { tag: 0x0500, type: "u16", value: [512] },
        { tag: 0x0501, type: "u16", value: [5800] },
        { tag: 0x0502, type: "s16", value: [2, 2] },
        { tag: 0x050a, type: "u16", value: [3] },
        { tag: 0x0527, type: "s16", value: [-1, -2, 1] },
      ]),
    );
    expect(recipe.tone).toEqual({
      highlights: { value: 4, min: -7, max: 7 },
      shadows: { value: -4, min: -7, max: 7 },
      midtones: { value: 0, min: -7, max: 7 },
    });
    expect(recipe.whiteBalance).toEqual({
      mode: { id: 512, label: "Custom WB 1" },
      temperature: 5800,
      bracket: { values: [2, 2], unverified: UNVERIFIED.whiteBalanceBracket },
    });
    expect(recipe.processing).toMatchObject({
      noiseFilter: { label: "Low" },
      noiseReduction: ["Noise Reduction", "Noise Filter"],
      gradation: { value: 0, min: -1, max: 1, label: "Normal", selection: "User-Selected" },
    });
  });

  it("treats a 0 K white balance temperature as auto", () => {
    const recipe = recipeFor(withSettings([{ tag: 0x0501, type: "u16", value: [0] }]));
    expect(recipe.whiteBalance.temperature).toBeUndefined();
  });

  it("labels unknown values instead of failing", () => {
    const recipe = recipeFor(withSettings([mode(99), { tag: 0x0500, type: "u16", value: [999] }]));
    expect(recipe.profile).toEqual({ kind: "unknown", mode: { id: 99, label: "Unknown (99)" } });
    expect(recipe.whiteBalance.mode).toEqual({ id: 999, label: "Unknown (999)" });
  });

  it("copes with a maker note that has no CameraSettings", () => {
    const makerNote = buildMakerNote("OM SYSTEM", [{ tag: 0x0209, type: "ascii", value: "OM SYSTEM CAMERA" }]);
    const result = parseJpeg(buildOmJpeg({ makerNote }));
    if (!result.ok) throw new Error(result.error.message);
    const recipe = buildRecipe(result.metadata);
    expect(recipe.profile).toEqual({ kind: "unknown", mode: { id: -1, label: "Unknown" } });
    expect(recipe.tone).toEqual({});
    expect(recipe.raw).toEqual([]);
    expect(recipe.camera.model).toBe("PEN");
    expect(recipe.lens.model).toBe("OM 14-42mm F3.5-5.6 III");
  });

  it("lists every CameraSettings entry in the raw table, sorted, with names where known", () => {
    const recipe = recipeFor(sampleCameraSettings);
    expect(recipe.raw.map((r) => r.tag)).toEqual([...sampleCameraSettings.map((f) => f.tag)].sort((a, b) => a - b));
    expect(recipe.raw.find((r) => r.tag === 0x0539)).toEqual({
      tag: 0x0539,
      id: "0x0539",
      name: "ColorProfileSettings",
      type: "int16s",
      count: 14,
      display: "-5 5 4 4 4 4 0 -1 1 4 4 4 4 1",
    });
    expect(recipe.raw.find((r) => r.tag === 0x0535)?.display).toBe("undef");
    expect(recipe.raw.find((r) => r.tag === 0x0000)?.display).toBe("0100");
  });
});
