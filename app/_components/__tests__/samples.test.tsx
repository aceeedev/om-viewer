import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SAMPLE_PHOTOS, SAMPLE_SOURCE_PAGE } from "@/lib/sample-photos";
import { RecipeViewer } from "../recipe-viewer";
import { SampleCredit, SampleSourceNote, TrySampleButton } from "../samples";

const noop = () => {};

/** Every <a> in the markup, with its attributes and text. */
function links(html: string) {
  return [...html.matchAll(/<a ([^>]*)>([^<]*)<\/a>/g)].map(([, attrs, text]) => ({
    href: /href="([^"]*)"/.exec(attrs)?.[1],
    rel: /rel="([^"]*)"/.exec(attrs)?.[1],
    target: /target="([^"]*)"/.exec(attrs)?.[1],
    text: text.replace(/&#x27;/g, "'").replace(/&amp;/g, "&"),
  }));
}

describe("SampleCredit", () => {
  it.each(SAMPLE_PHOTOS.map((photo) => [photo.name, photo] as const))(
    "credits %s's profile and photographer, and links where it was found",
    (_name, photo) => {
      const html = renderToStaticMarkup(<SampleCredit photo={photo} />);
      expect(html.replace(/&amp;/g, "&").replace(/&#x27;/g, "'")).toContain(`“${photo.title}”`);
      expect(links(html)).toEqual([
        { href: photo.artistUrl, rel: "noopener noreferrer", target: "_blank", text: photo.artist },
        { href: SAMPLE_SOURCE_PAGE.url, rel: "noopener noreferrer", target: "_blank", text: SAMPLE_SOURCE_PAGE.title },
      ]);
    },
  );
});

describe("TrySampleButton", () => {
  it("offers a sample", () => {
    expect(renderToStaticMarkup(<TrySampleButton onTry={noop} />)).toContain(">Try a sample<");
  });

  it("is disabled while a photo is being read", () => {
    expect(renderToStaticMarkup(<TrySampleButton onTry={noop} busy />)).toMatch(/<button[^>]*disabled/);
  });
});

describe("RecipeViewer before a photo is open", () => {
  it("offers a sample below the drop box, and says where samples come from", () => {
    const html = renderToStaticMarkup(<RecipeViewer />);
    expect(html.indexOf("Try a sample")).toBeGreaterThan(html.indexOf("Drop an OM System JPEG here"));
    expect(links(html)).toContainEqual(expect.objectContaining({ href: SAMPLE_SOURCE_PAGE.url }));
    expect(renderToStaticMarkup(<SampleSourceNote />)).toContain("OM SYSTEM Ambassador photographer");
  });
});
