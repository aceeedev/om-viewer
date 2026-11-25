import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseJpeg, readPhotoMetadata } from "@/lib/exif";
import { buildOmJpeg, sampleCameraSettings, type Field } from "@/lib/exif/__tests__/helpers/build-jpeg";
import { buildRecipe, type Recipe } from "@/lib/recipe";
import { SAMPLES_DIR, sampleFiles } from "@/lib/test-utils/samples";
import { FullView } from "../full-view";
import { RecipeViewer } from "../recipe-viewer";
import { profileSections } from "../sections";
import { SimpleView } from "../simple-view";

/** Rendered text with tags stripped and whitespace collapsed. */
function text(element: React.ReactElement): string {
  return renderToStaticMarkup(element)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/\s+/g, " ");
}

function syntheticRecipe(overrides: Field[]): Recipe {
  const replaced = new Set(overrides.map((f) => f.tag));
  const cameraSettings = [...sampleCameraSettings.filter((f) => !replaced.has(f.tag)), ...overrides];
  const result = parseJpeg(buildOmJpeg({ cameraSettings }));
  if (!result.ok) throw new Error(result.error.message);
  return buildRecipe(result.metadata);
}

const mode = (id: number): Field => ({ tag: 0x0520, type: "u16", value: [id, 2] });

describe("SimpleView", () => {
  it("shows a Color Profile's hues, shading, picture settings and tone", () => {
    const t = text(<SimpleView recipe={syntheticRecipe([mode(9)])} />);
    expect(t).toContain("Color Profile 1");
    expect(t).toContain("Color Profile Control");
    expect(t).toMatch(/Yellow \+4 \(−5 to \+5\)/);
    expect(t).toMatch(/Violet −1/);
    expect(t).toContain("Shading");
    expect(t).toContain("Unverified");
    expect(t).toMatch(/Contrast −2 \(−2 to \+2\)/);
    expect(t).toMatch(/Highlights \+4 \(−7 to \+7\)/);
    expect(t).not.toContain("White balance"); // Full view only
  });

  it("hides filter strength when a Monochrome Profile has no filter", () => {
    const noFilter = syntheticRecipe([mode(12), { tag: 0x0537, type: "s16", value: [0, 0, 8, 2, 0, 3] }]);
    expect(text(<SimpleView recipe={noFilter} />)).not.toContain("Filter strength");
    expect(text(<FullView recipe={noFilter} />)).toContain("Filter strength");

    const red = syntheticRecipe([mode(12), { tag: 0x0537, type: "s16", value: [3, 0, 8, 2, 0, 3] }]);
    const t = text(<SimpleView recipe={red} />);
    expect(t).toContain("Red Filter");
    expect(t).toMatch(/Filter strength 2 \(0 to 3\)/);
    expect(t).toContain("Film grain High");
    expect(t).toContain("Toning Normal");
  });

  it("explains an unrecognized picture mode", () => {
    const t = text(<SimpleView recipe={syntheticRecipe([mode(99)])} />);
    expect(t).toContain("Unknown (99)");
    expect(t).toContain("isn't recognized");
  });

  it("gives every picture mode at least one section", () => {
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 256, 512]) {
      const recipe = syntheticRecipe([mode(id)]);
      expect(profileSections(recipe.profile, { simple: true }).length, `mode ${id}`).toBeGreaterThan(0);
    }
  });
});

describe("FullView", () => {
  it("shows white balance, processing, exposure, gear and the raw table", () => {
    const t = text(<FullView recipe={syntheticRecipe([{ tag: 0x0500, type: "u16", value: [512] }])} />);
    for (const s of ["Picture mode", "White balance", "Custom WB 1", "Processing", "Exposure", "Camera & lens"]) {
      expect(t).toContain(s);
    }
    expect(t).toContain("1/250 s");
    expect(t).toContain("f/4");
    expect(t).toContain("OM 14-42mm F3.5-5.6 III");
    expect(t).toMatch(/All maker-note values \(\d+\)/);
    expect(t).toContain("0x0539 ColorProfileSettings int16s[14] -5 5 4 4 4 4 0 -1 1 4 4 4 4 1");
  });
});

describe("RecipeViewer", () => {
  it("starts with a JPEG file picker", () => {
    const html = renderToStaticMarkup(<RecipeViewer />);
    expect(html).toContain('type="file"');
    expect(html).toContain('accept="image/jpeg,.jpg,.jpeg"');
    expect(text(<RecipeViewer />)).toContain("Drop an OM System JPEG here");
  });
});

describe.skipIf(sampleFiles.length === 0)("views render every sample", () => {
  it.each(sampleFiles)("%s", async (file) => {
    const result = await readPhotoMetadata(new Blob([readFileSync(path.join(SAMPLES_DIR, file))]));
    if (!result.ok) throw new Error(result.error.message);
    const recipe = buildRecipe(result.metadata);
    const simple = text(<SimpleView recipe={recipe} />);
    const full = text(<FullView recipe={recipe} />);
    expect(simple).toContain(recipe.profile.mode.label);
    expect(full).toContain(recipe.profile.mode.label);
    expect(full).toContain("All maker-note values");
  });
});
