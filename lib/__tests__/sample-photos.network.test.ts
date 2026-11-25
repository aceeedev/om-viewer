/**
 * Downloads the start of every sample's original (`source`) and checks it still exists and opens as a
 * recipe, so `pnpm samples:build` keeps working. Needs the network, so it only runs through
 * `pnpm test:samples` (CHECK_SAMPLES=1).
 */
import { describe, expect, it } from "vitest";
import { parseJpeg } from "@/lib/exif";
import { buildRecipe } from "@/lib/recipe";
import { SAMPLE_PHOTOS } from "../sample-photos";

/** Enough for the Exif segment, which sits at the start of the file; spares downloading 10+ MB each. */
const HEAD_BYTES = 1024 * 1024;

describe.runIf(process.env.CHECK_SAMPLES)("sample photo originals", () => {
  it.concurrent.each(SAMPLE_PHOTOS.map((photo) => [photo.name, photo] as const))(
    "%s: original exists and opens as a recipe",
    async (_name, photo) => {
      const response = await fetch(photo.source, { headers: { range: `bytes=0-${HEAD_BYTES - 1}` } });
      expect(response.status, `${photo.source} answered ${response.status}`).toBeOneOf([200, 206]);
      expect(response.headers.get("content-type")).toMatch(/^image\/jpe?g/);

      const result = parseJpeg(new Uint8Array(await response.arrayBuffer()));
      if (!result.ok) throw new Error(`${photo.source}: ${result.error.message}`);
      const recipe = buildRecipe(result.metadata);
      expect(recipe.profile.kind).toBeTruthy();
      expect(recipe.camera.model).toBeTruthy();
    },
    30_000,
  );
});
