import { readFileSync } from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseJpeg, readPhotoMetadata } from "@/lib/exif";
import { buildOmJpeg, sampleCameraSettings, type Field } from "@/lib/exif/__tests__/helpers/build-jpeg";
import { buildRecipe, type Recipe } from "@/lib/recipe";
import { SAMPLES_DIR, sampleFiles } from "@/lib/test-utils/samples";
import { FullView } from "../full-view";
import { LoadError, RecipeViewer } from "../recipe-viewer";
import { pictureModeName, profileSections } from "../sections";
import { SimpleView } from "../simple-view";

/** Rendered text with tags stripped and whitespace collapsed. */
function text(element: React.ReactElement): string {
  return renderToStaticMarkup(element)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
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
  it("shows a Color Profile as a hue wheel beside its sliders", () => {
    const recipe = syntheticRecipe([mode(9)]);
    const html = renderToStaticMarkup(<SimpleView recipe={recipe} />);
    const t = text(<SimpleView recipe={recipe} />);
    expect(t).toContain("Picture mode Color Profile 1");
    // Every hue's value around the wheel, clockwise in the camera's order from Yellow.
    expect(t).toContain("+4 +4 +4 +4 0 −1 +1 +4 +4 +4 +4 +1"); // signed, as the camera prints them
    // Screen-reader list of every hue with its range.
    expect(t).toMatch(/Yellow \+4 \(−5 to \+5\)/);
    expect(t).toMatch(/Violet −1 \(−5 to \+5\)/);
    // The settings screen: each setting's name and its value as the camera prints it, with its
    // range for screen readers.
    expect(t).toMatch(
      /Settings Shading Effect −3 \(−5 to \+5\) Sharpness −1 \(−2 to \+2\) Contrast −2 \(−2 to \+2\) Exposure Comp −0\.7 \(−5 to \+5\)/,
    );
    expect(t).not.toContain("unverified");
    expect(text(<FullView recipe={recipe} />)).not.toContain("Unverified");
    // Tone curve: "Sh −4  Mid ±0  Hi +4" across the top of the screen, as on the camera; two curves.
    expect(t).toMatch(/Highlight & Shadow Sh −4 .*Mid ±0 .*Hi \+4 .*Shadows −4 \(−7 to \+7\) Midtones 0 \(−7 to \+7\) Highlights \+4 \(−7 to \+7\)/);
    expect(html.match(/<path d="M36 260Q/g)).toHaveLength(2);
    expect(t).not.toMatch(/Highlights: \+4 \(/); // not a slider row
    // White balance before the settings: mode, then the fine-tune (A+2 G+2 in the fixture).
    expect(t).toMatch(
      /White balance Auto \(Keep Warm Color On\) A2\.G2 fine-tune amber 2, green 2 \(−7 to \+7 each\) Keep Warm Color On G M B A Settings Shading Effect/,
    );
    expect(html).toContain('<circle cx="158" cy="92" r="3"'); // 2 steps of 9 right and up from 140, 110
    // A colored side of the outline and a dot per hue, with the hue's name on hover.
    // Each side of the outline blends from its hue to the next; the wheel inside is one conic
    // gradient through all 12 hues, Yellow at the top, clipped to the outline.
    expect(html.match(/<polygon points="[^"]*" fill="url\(#[^"]*-side-\d+\)"/g)).toHaveLength(12);
    expect(html).toContain('<stop offset="0" stop-color="#fbe405"></stop><stop offset="1" stop-color="#ffa839"></stop>');
    expect(html).toContain("conic-gradient(#fbe405 0deg, #ffa839 30deg, #fa5f29 60deg");
    expect(html).toContain("#fbe405 360deg)");
    expect(html).toContain("clip-path:polygon(50% 0%,"); // the top corner
    expect(html.match(/<circle cx="[^"]*" cy="[^"]*" r="5.5"/g)).toHaveLength(12);
    expect(html).toContain("<title>Violet: −1</title>");
  });

  it("marks each setting's value on its scale, lit out from 0", () => {
    const recipe = syntheticRecipe([mode(9)]);
    const html = renderToStaticMarkup(<SimpleView recipe={recipe} />);
    const marker = (left: string) => `ring-[length:calc(var(--spacing)/2)] ring-screen" style="left:${left}"`;
    // Contrast −2 on −2..+2: the marker at the left end, lit from there to 0 in the middle.
    expect(html).toContain(marker("0%"));
    expect(html).toContain('style="left:0%;width:50%"');
    // Sharpness −1: a quarter along. Shading −3 on −5..+5: a fifth along, lit to the middle.
    expect(html).toContain(marker("25%"));
    expect(html).toContain('style="left:20%;width:30%"');
    // Exposure −0.7 on −5..+5: 43% along, lit from there to the middle.
    expect(html).toContain(marker("43%"));
    expect(html).toContain('style="left:43%;width:7%"');
    // A tick per step, the one at 0 taller: 11 on −5..+5, 5 on −2..+2.
    expect(html.match(/h-2\.5 bg-white\/60/g)).toHaveLength(4);
    expect(html.match(/w-px -translate-x-1\/2 -translate-y-1\/2 h-1\.5/g)).toHaveLength(10 + 4 + 4 + 10);
  });

  it("shows a Monochrome Profile as a filter wheel beside its sliders", () => {
    // The fixture: no filter (level 2 stored anyway), grain High, shading −3, toning Normal.
    const recipe = syntheticRecipe([mode(12)]);
    const html = renderToStaticMarkup(<SimpleView recipe={recipe} />);
    const t = text(<SimpleView recipe={recipe} />);
    expect(t).toContain("Picture mode Monochrome Profile 1");
    // No filter: said so in the corner, no level, every side dimmed and no pointer or glow.
    expect(t).toContain("Color filter No Filter No Filter Yellow");
    expect(t).not.toContain("Level");
    expect(html.match(/fill-opacity="0.35"/g)).toHaveLength(8);
    expect(html).not.toMatch(/<line x1="0" y1="0" [^>]*stroke-width="2"/);
    expect(html).not.toContain("-glow");
    // On a camera-style screen, every filter's name around the wheel.
    expect(html).toContain('class="block w-full tabular-nums rounded-xl bg-screen');
    expect(t).toContain("No Filter Yellow Orange Red Magenta Blue Cyan Green Yellow-green Highlight");
    // Tone curve and white balance as in Color Profile.
    expect(t).toMatch(/Highlight & Shadow Sh −4/);
    expect(t).toContain("White balance Auto (Keep Warm Color On) A2.G2");
    // Settings and toning, each with its choices for screen readers.
    expect(t).toMatch(
      /Settings Shading Effect −3 \(−5 to \+5\) Film Grain High \(Off, Low, Medium, High\) Toning Normal \(Normal, Sepia, Blue, Purple, Green\) Sharpness −1 \(−2 to \+2\) Contrast −2 \(−2 to \+2\) Exposure Comp −0\.7/,
    );
    // Grain High: the right end, lit all the way from Off (a range from 0 is lit from its start).
    expect(html).toContain('ring-[length:calc(var(--spacing)/2)] ring-screen" style="left:100%"');
    expect(html).toContain('style="left:0%;width:100%"');
    expect(html).toContain('title="Normal" class="size-3 rounded-full ring-[length:calc(var(--spacing)/2)] ring-white');
    // The Full view still lists the stored strength.
    expect(text(<FullView recipe={recipe} />)).toContain("Filter strength");
  });

  it("points the filter wheel at the filter in use, out to its level", () => {
    const red = syntheticRecipe([
      mode(12),
      { tag: 0x0537, type: "s16", value: [3, 0, 8, 3, 0, 3] },
      { tag: 0x053b, type: "s16", value: [2] },
    ]);
    const html = renderToStaticMarkup(<SimpleView recipe={red} />);
    const t = text(<SimpleView recipe={red} />);
    expect(t).toContain("Color filter Red, level 3 (0 to 3) Level 3");
    // Red is third clockwise from the top (90°); level 3 of 3 reaches the outer ring (66).
    expect(html).toContain('<line x1="0" y1="0" x2="66" y2="0" stroke="white" stroke-width="2"');
    expect(html).toContain('<circle cx="66" cy="0" r="5.5" fill="#eb3062"');
    expect(html).toContain('fill="#eb3062" fill-opacity="1"');
    expect(html.match(/fill-opacity="0.35"/g)).toHaveLength(7);
    expect(html).toContain("<title>Red filter, level 3</title>");
    // Red's wedge of the face glows red, brightest at the edge.
    expect(html).toContain('<stop offset="1" stop-color="#eb3062" stop-opacity="0.4">');
    expect(html).toMatch(/<polygon points="0,0 [^"]*" fill="url\(#[^"]*-glow\)"/);
    // A ring per level (1–3), each an octagon like the outline.
    expect(html.match(/<polygon points="(?:[^ "]+ ){7}[^ "]+" stroke-opacity="0.28"/g)).toHaveLength(3);
    expect(t).toContain("Toning Sepia");
    expect(html).toContain('title="Sepia" class="size-3 rounded-full ring-[length:calc(var(--spacing)/2)] ring-white');
    expect(html).toContain('title="Normal" class="size-3 rounded-full opacity-55');
  });

  it("shows the tone curve for other modes, but not for Art", () => {
    const mono = renderToStaticMarkup(<SimpleView recipe={syntheticRecipe([mode(12)])} />);
    expect(mono).toContain("Highlight &amp; Shadow");
    expect(mono.match(/<path d="M36 260Q/g)).toHaveLength(2);
    expect(mono).not.toContain("<table");
    const art = renderToStaticMarkup(<SimpleView recipe={syntheticRecipe([mode(17)])} />);
    expect(art).not.toContain("Highlight &amp; Shadow");
  });

  it("shows white balance in every mode, Art included", () => {
    for (const id of [5, 12, 13, 17, 99]) {
      expect(text(<SimpleView recipe={syntheticRecipe([mode(id)])} />), `mode ${id}`).toContain(
        "White balance Auto (Keep Warm Color On) A2.G2",
      );
    }
    const custom = syntheticRecipe([
      mode(12),
      { tag: 0x0500, type: "u16", value: [512] },
      { tag: 0x0501, type: "u16", value: [5800] },
      { tag: 0x0502, type: "s16", value: [-3, -1] },
    ]);
    expect(text(<SimpleView recipe={custom} />)).toContain("White balance Custom WB 1 (5800K) B3.M1");
    // The tabs toward the shift are white, B and M here; the others are greyed out.
    const html = renderToStaticMarkup(<SimpleView recipe={custom} />);
    const tab = (letter: string) => html.match(new RegExp(`<g><rect [^>]*></rect><text [^>]*>${letter}</text></g>`))![0];
    expect(tab("B")).toContain('fill="none" stroke="white" stroke-opacity="1"');
    expect(tab("M")).toContain('fill="none" stroke="white" stroke-opacity="1"');
    expect(tab("A")).toContain('fill="none" stroke="white" stroke-opacity="0.3"');
    expect(tab("G")).toContain('fill="none" stroke="white" stroke-opacity="0.3"');
    // Each edge of the box is one solid color, not a gradient.
    expect(html).not.toContain("linearGradient");
    for (const color of ["#3a66ed", "#d227b0"]) expect(html).toMatch(new RegExp(`<polygon points="[^"]*" fill="${color}"`));
  });

  it("spells out the fine-tune under the screens on touch screens, which can't hover", () => {
    const recipe = syntheticRecipe([mode(12), { tag: 0x0502, type: "s16", value: [-3, -1] }]);
    const html = renderToStaticMarkup(<SimpleView recipe={recipe} />);
    expect(html).toContain(
      '<p aria-hidden="true" class="hidden text-xs text-zinc-600 pointer-coarse:block">White balance fine-tune B3.M1: blue 3, magenta 1</p>',
    );
    // Computers keep the tooltip on the screen.
    expect(html).toContain('title="Fine-tune: blue 3, magenta 1"');
  });

  it("leaves out the fine-tune box when the shot has no two-value fine-tune", () => {
    const recipe = syntheticRecipe([mode(12), { tag: 0x0500, type: "u16", value: [1] }, { tag: 0x0502, type: "s16", value: [3] }]);
    const html = renderToStaticMarkup(<SimpleView recipe={recipe} />);
    expect(text(<SimpleView recipe={recipe} />)).toContain("White balance Auto (Keep Warm Color Off)");
    expect(html).not.toContain("fine-tune");
    expect(html).not.toMatch(/>G</);
  });

  it("explains an unrecognized picture mode", () => {
    const t = text(<SimpleView recipe={syntheticRecipe([mode(99)])} />);
    expect(t).toContain("Unknown (99)");
    expect(t).toContain("isn't recognized");
  });

  it("shows Color Creator as a hue ring, pointing at the hue out to its saturation", () => {
    const recipe = syntheticRecipe([mode(7), { tag: 0x0532, type: "s16", value: [12, 0, 29, 2, -4, 3] }]);
    const html = renderToStaticMarkup(<SimpleView recipe={recipe} />);
    const t = text(<SimpleView recipe={recipe} />);
    expect(t).toContain("Picture mode Color Creator");
    // For screen readers, then across the top of the screen as on the tone screen.
    expect(t).toContain("Color Creator Hue * 12 (0 to 29) Saturation +2 (−4 to +3) Hue * 12 Saturation +2");
    // 30 colored steps (and the white balance box's 4 edges); step 12 is 144° clockwise, saturation +2 of −4..+3 is 6/7 of the way
    // from the inner ring (18.4) to just inside the outline (80): 71.2.
    expect(html.match(/<polygon points="[^"]*" fill="#[0-9a-f]{6}"/g)).toHaveLength(34);
    expect(html).toContain('<line x1="0" y1="0" x2="41.85" y2="57.6"');
    expect(html).toContain('<circle cx="41.85" cy="57.6" r="5.5" fill="#9c39dd"'); // between Magenta and Violet
    expect(html).toContain("<title>Hue 12, saturation +2</title>");
    // The face is the hue wheel's color wheel, clipped to the 30-sided ring, dimmed outside the
    // wedge toward step 12.
    expect(html).toContain("conic-gradient(#fbe405 0deg, #ffa839 30deg");
    expect(html).toMatch(/clip-path:polygon\((?:[^,)]+, ){29}[^,)]+\)/);
    expect(html).toMatch(/<path d="M[^"]*Z M0,0 [^"]*Z" fill="black" fill-opacity="0.5" fill-rule="evenodd"/);
    expect(t).toMatch(/Highlight & Shadow Sh −4/);
    expect(t).toMatch(/A2\.G2 .* Settings Sharpness −1 \(−2 to \+2\) Contrast −2 \(−2 to \+2\) Exposure Comp −0\.7/);
    expect(t).toContain("* Hue is unverified: which color each of the 30 steps is");
  });

  it("shows i-Enhance's effect and the standard modes' sliders", () => {
    const enhance = syntheticRecipe([mode(5), { tag: 0x052d, type: "s16", value: [1, -1, 1] }]);
    const t = text(<SimpleView recipe={enhance} />);
    expect(t).toContain("Picture mode i-Enhance");
    expect(t).toMatch(/Highlight & Shadow Sh −4/);
    expect(t).toMatch(
      /A2\.G2 .* Settings Effect High \(Low, Standard, High\) Saturation ±0 \(−2 to \+2\) Sharpness −1 \(−2 to \+2\) Contrast −2 \(−2 to \+2\) Gradation Normal \(Low Key, Normal, High Key\) Exposure Comp −0\.7/,
    );
    const html = renderToStaticMarkup(<SimpleView recipe={enhance} />);
    expect(html).toContain('ring-[length:calc(var(--spacing)/2)] ring-screen" style="left:100%"'); // effect High: the right end
    expect(html).not.toContain("<table");

    const vivid = text(<SimpleView recipe={syntheticRecipe([mode(1)])} />);
    expect(vivid).toContain("Picture mode Vivid");
    expect(vivid).not.toContain("Effect");
    expect(vivid).toContain("Settings Saturation ±0");
  });

  it("marks a gradation the camera flagged as auto-overridden", () => {
    const t = text(<SimpleView recipe={syntheticRecipe([mode(2), { tag: 0x050f, type: "s16", value: [1, -1, 1, 1] }])} />);
    expect(t).toContain("Gradation * High Key");
    expect(t).toContain('* Gradation is unverified: the camera flagged it "Auto-Override"');
    expect(text(<SimpleView recipe={syntheticRecipe([mode(2)])} />)).not.toContain("unverified");
  });

  it("shows the Monochrome mode's color filter and toning as swatches", () => {
    const recipe = syntheticRecipe([
      mode(256),
      { tag: 0x0525, type: "s16", value: [4] },
      { tag: 0x0526, type: "s16", value: [2] },
    ]);
    const html = renderToStaticMarkup(<SimpleView recipe={recipe} />);
    const t = text(<SimpleView recipe={recipe} />);
    // The manual's name, in both views; ExifTool calls this mode "Monotone".
    expect(recipe.profile.mode.label).toBe("Monotone");
    expect(t).toContain("Picture mode Monochrome Highlight");
    expect(text(<FullView recipe={recipe} />)).toContain("Picture mode Mode Monochrome");
    expect(t).toMatch(
      /Settings Color Filter Red \(None, Yellow, Orange, Red, Green\) Toning Sepia \(Normal, Sepia, Blue, Purple, Green\) Sharpness −1 .* Contrast −2 .* Gradation Normal .* Exposure Comp/,
    );
    expect(html).toContain(
      'title="Red" class="size-3 rounded-full ring-[length:calc(var(--spacing)/2)] ring-white ring-offset-[length:calc(var(--spacing)/2)] ring-offset-screen" style="background-color:#eb3062"',
    );
    expect(html).toContain('title="Sepia" class="size-3 rounded-full ring-[length:');
    // Not recorded (ExifTool's "n/a"): no rows.
    const none = text(<SimpleView recipe={syntheticRecipe([mode(256)])} />);
    expect(none).not.toContain("Color Filter");
    expect(none).not.toContain("Toning");
  });

  it("shows an art filter and its effect", () => {
    const effect = new Array(20).fill(0);
    effect[4] = 0x8030;
    const recipe = syntheticRecipe([
      mode(17),
      { tag: 0x0529, type: "u16", value: [19, 0, 0, 0] },
      { tag: 0x052f, type: "u16", value: effect },
    ]);
    const t = text(<SimpleView recipe={recipe} />);
    expect(t).toMatch(/A2\.G2 .* Settings Art Filter Grainy Film II Effect Frame Exposure Comp −0\.7/);
    expect(t).not.toContain("Sharpness");
    const noEffect = syntheticRecipe([mode(17), { tag: 0x0529, type: "u16", value: [19, 0, 0, 0] }, { tag: 0x052f, type: "u16", value: new Array(20).fill(0) }]);
    expect(text(<SimpleView recipe={noEffect} />)).toContain("Effect Off");
  });

  it("puts screens two to a row on phones (one below 360px), each scaled to its own column, with larger text on narrow ones", () => {
    for (const id of [9, 7, 12, 17, 99]) {
      const html = renderToStaticMarkup(<SimpleView recipe={syntheticRecipe([mode(id)])} />);
      expect(html, `mode ${id}`).toContain(
        'class="grid grid-cols-1 items-start gap-6 min-[22.5rem]:grid-cols-2 min-[22.5rem]:gap-3 ' +
          'sm:flex sm:flex-wrap sm:gap-6 min-[22.5rem]:max-[30rem]:[--screen-text-boost:1.25]"',
      );
      const columns = html.match(/class="@container flex w-full max-w-70/g) ?? [];
      const screens = html.match(/rounded-xl bg-screen screen-scale/g) ?? [];
      expect(screens.length, `mode ${id}`).toBeGreaterThan(0);
      expect(screens.length, `mode ${id}`).toBe(columns.length);
    }
  });

  it("draws every picture mode as panels, with no plain tables left", () => {
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 256, 512, 99]) {
      const html = renderToStaticMarkup(<SimpleView recipe={syntheticRecipe([mode(id)])} />);
      expect(html, `mode ${id}`).not.toContain("<table");
      expect(html, `mode ${id}`).toContain("White balance");
      expect(html, `mode ${id}`).toContain("Exposure Comp");
    }
  });
});

describe("FullView", () => {
  it("gives every picture mode at least one section", () => {
    for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 17, 18, 256, 512]) {
      const recipe = syntheticRecipe([mode(id)]);
      expect(profileSections(recipe.profile).length, `mode ${id}`).toBeGreaterThan(0);
    }
  });

  it("shows white balance, processing, exposure, gear and the raw table", () => {
    const t = text(<FullView recipe={syntheticRecipe([{ tag: 0x0500, type: "u16", value: [512] }])} />);
    for (const s of ["Picture mode", "White balance", "Custom WB 1", "Processing", "Exposure", "Camera & lens"]) {
      expect(t).toContain(s);
    }
    expect(t).not.toContain("Keep Warm Color"); // only Auto has it
    expect(text(<FullView recipe={syntheticRecipe([])} />)).toContain("Mode Auto Keep Warm Color On");
    expect(t).toMatch(/Fine-tune, amber \(\+\) \/ blue \(−\) \+2 \(−7 to \+7\)/);
    expect(t).toMatch(/Fine-tune, green \(\+\) \/ magenta \(−\) \+2 \(−7 to \+7\)/);
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

describe("LoadError", () => {
  it("has both wordings when phones get their own, one hidden on phones and the other only on phones", () => {
    const html = renderToStaticMarkup(<LoadError fileName="a.jpg" message="Drop it here." phoneMessage="Open it here." />);
    expect(html).toContain('<span class="phone:hidden">Drop it here.</span>');
    expect(html).toContain('<span class="hidden phone:inline">Open it here.</span>');
  });

  it("shows a message phones share as plain text after the file name", () => {
    const error = <LoadError fileName="notes.txt" message="This file isn't a JPEG." />;
    expect(renderToStaticMarkup(error)).not.toContain("phone:");
    expect(text(error).trim()).toBe("notes.txt: This file isn't a JPEG.");
  });
});

describe.skipIf(sampleFiles.length === 0)("views render every sample", () => {
  it.each(sampleFiles)("%s", async (file) => {
    const result = await readPhotoMetadata(new Blob([readFileSync(path.join(SAMPLES_DIR, file))]));
    if (!result.ok) throw new Error(result.error.message);
    const recipe = buildRecipe(result.metadata);
    const simple = text(<SimpleView recipe={recipe} />);
    const full = text(<FullView recipe={recipe} />);
    expect(simple).toContain(pictureModeName(recipe.profile.mode));
    expect(full).toContain(pictureModeName(recipe.profile.mode));
    expect(full).toContain("All maker-note values");
  });
});
