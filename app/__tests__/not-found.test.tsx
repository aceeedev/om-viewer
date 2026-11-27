import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import NotFound, { metadata } from "../not-found";

describe("NotFound", () => {
  const html = renderToStaticMarkup(<NotFound />);

  it("says the page wasn't found", () => {
    expect(html).toMatch(/<h1[^>]*>Page not found<\/h1>/);
  });

  it("links back to the viewer, and nowhere else", () => {
    const links = [...html.matchAll(/<a [^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map(([, href, text]) => ({
      href,
      text,
    }));
    expect(links).toEqual([{ href: "/", text: "Go to the viewer" }]);
  });

  it("sets a title, with no canonical URL or Open Graph tags", () => {
    expect(metadata).toEqual({ title: "Page not found" });
  });
});
