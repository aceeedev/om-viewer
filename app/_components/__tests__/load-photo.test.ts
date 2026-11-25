import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOmJpeg } from "@/lib/exif/__tests__/helpers/build-jpeg";
import { loadPhotoFile, loadPhotoUrl } from "../load-photo";

afterEach(() => {
  vi.unstubAllGlobals();
});

const omJpeg = () => new Response(new Uint8Array(buildOmJpeg()), { headers: { "content-type": "image/jpeg" } });

describe("loadPhotoFile", () => {
  it("turns an OM System JPEG into its recipe", async () => {
    const file = new File([buildOmJpeg()], "P1010042.JPG", { type: "image/jpeg" });
    const result = await loadPhotoFile(file);
    if (!result.ok) throw new Error(result.message);
    expect(result.fileName).toBe("P1010042.JPG");
    expect(result.file).toBe(file);
    expect(result.recipe.camera.model).toBeTruthy();
  });

  it("explains a file it can't read", async () => {
    const result = await loadPhotoFile(new File(["hello"], "notes.txt"));
    expect(result).toEqual({ ok: false, fileName: "notes.txt", message: "This file isn't a JPEG." });
  });
});

describe("loadPhotoUrl", () => {
  it("opens a link exactly like a dropped file", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof globalThis.fetch>(async () => omJpeg()));
    const fromUrl = await loadPhotoUrl("https://example.com/photos/P1010042.JPG?dl=1");
    const fromFile = await loadPhotoFile(new File([buildOmJpeg()], "P1010042.JPG"));
    if (!fromUrl.ok || !fromFile.ok) throw new Error("expected both to open");
    expect(fromUrl.fileName).toBe("P1010042.JPG");
    expect(fromUrl.recipe).toEqual(fromFile.recipe);
  });

  it("labels a failed download with the link itself", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof globalThis.fetch>(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const result = await loadPhotoUrl("  https://example.com/a.jpg ");
    expect(result).toMatchObject({ ok: false, fileName: "https://example.com/a.jpg" });
    if (!result.ok) expect(result.message).toContain("drop it here instead");
  });

  it("labels a downloaded file that isn't a photo with its name", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof globalThis.fetch>(async () => new Response("hello")));
    const result = await loadPhotoUrl("https://example.com/files/readme");
    expect(result).toEqual({ ok: false, fileName: "readme", message: "This file isn't a JPEG." });
  });
});
