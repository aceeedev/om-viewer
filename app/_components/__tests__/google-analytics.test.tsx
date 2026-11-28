import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GoogleAnalytics } from "../google-analytics";

describe("GoogleAnalytics", () => {
  it("puts nothing from Google in the server's HTML", () => {
    // The answer is only known in the browser, so the static page never names Google's script.
    const html = renderToStaticMarkup(<GoogleAnalytics measurementId="G-TEST123" />);
    expect(html).toBe("");
  });
});
