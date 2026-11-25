import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOmJpeg } from "@/lib/exif/__tests__/helpers/build-jpeg";
import { readPhotoMetadata } from "@/lib/exif";
import { fetchImageFromUrl, fileNameFrom, MAX_IMAGE_BYTES } from "../fetch-image";

/** Answer every fetch() with this response (or throw this error), and record what was asked. */
function stubFetch(answer: Response | Error) {
  const fetch = vi.fn<typeof globalThis.fetch>(async () => {
    if (answer instanceof Error) throw answer;
    return answer;
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

const jpeg = (headers: HeadersInit = { "content-type": "image/jpeg" }) =>
  new Response(new Uint8Array(buildOmJpeg()), { status: 200, headers });

async function errorCode(url: string) {
  const result = await fetchImageFromUrl(url);
  if (result.ok) throw new Error("expected a failure");
  return result.error.code;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchImageFromUrl", () => {
  it("returns the image as a File the EXIF reader can open", async () => {
    stubFetch(jpeg());
    const result = await fetchImageFromUrl("  https://example.com/photos/P1010042.JPG?dl=1 ");
    if (!result.ok) throw new Error(result.error.message);
    expect(result.file.name).toBe("P1010042.JPG");
    expect(result.file.type).toBe("image/jpeg");
    expect((await readPhotoMetadata(result.file)).ok).toBe(true);
  });

  it("asks without cookies or a referrer", async () => {
    const fetch = stubFetch(jpeg());
    await fetchImageFromUrl("https://example.com/a.jpg");
    expect(fetch.mock.calls[0][1]).toMatchObject({
      mode: "cors",
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
  });

  it("leaves a generic or missing type to the EXIF reader", async () => {
    stubFetch(jpeg({ "content-type": "application/octet-stream" }));
    expect((await fetchImageFromUrl("https://example.com/a")).ok).toBe(true);
    stubFetch(jpeg({}));
    expect((await fetchImageFromUrl("https://example.com/a")).ok).toBe(true);
  });

  it("rejects text that isn't an http(s) link without fetching", async () => {
    const fetch = stubFetch(jpeg());
    expect(await errorCode("not a link")).toBe("invalid-url");
    expect(await errorCode("")).toBe("invalid-url");
    expect(await errorCode("ftp://example.com/a.jpg")).toBe("unsupported-protocol");
    expect(await errorCode("data:image/jpeg;base64,AAAA")).toBe("unsupported-protocol");
    expect(await errorCode("javascript:alert(1)")).toBe("unsupported-protocol");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("explains that an https page can't load http:// links", async () => {
    const fetch = stubFetch(jpeg());
    vi.stubGlobal("location", { protocol: "https:" });
    expect(await errorCode("http://example.com/a.jpg")).toBe("insecure");
    expect(fetch).not.toHaveBeenCalled();
    vi.stubGlobal("location", { protocol: "http:" }); // e.g. next dev on localhost
    expect((await fetchImageFromUrl("http://example.com/a.jpg")).ok).toBe(true);
  });

  it("says the site blocked it when fetch fails outright (CORS, offline)", async () => {
    stubFetch(new TypeError("Failed to fetch"));
    const result = await fetchImageFromUrl("https://example.com/a.jpg");
    expect(result).toMatchObject({ ok: false, error: { code: "blocked" } });
    if (!result.ok) expect(result.error.message).toContain("drop it here instead");
  });

  it("reports when it was stopped", async () => {
    stubFetch(new DOMException("The operation was aborted.", "AbortError"));
    expect(await errorCode("https://example.com/a.jpg")).toBe("aborted");
  });

  it("names the HTTP error", async () => {
    stubFetch(new Response("", { status: 404 }));
    const missing = await fetchImageFromUrl("https://example.com/a.jpg");
    expect(missing).toMatchObject({ ok: false, error: { code: "http-error" } });
    if (!missing.ok) expect(missing.error.message).toContain("404");

    stubFetch(new Response("", { status: 403 }));
    const forbidden = await fetchImageFromUrl("https://example.com/a.jpg");
    if (!forbidden.ok) expect(forbidden.error.message).toContain("private");

    stubFetch(new Response("", { status: 500 }));
    const broken = await fetchImageFromUrl("https://example.com/a.jpg");
    if (!broken.ok) expect(broken.error.message).toContain("500");
  });

  it("spots a link to a web page instead of the image", async () => {
    stubFetch(new Response("<html></html>", { headers: { "content-type": "text/html; charset=utf-8" } }));
    expect(await errorCode("https://example.com/photo/123")).toBe("web-page");
  });

  it("names other image formats", async () => {
    stubFetch(new Response("", { headers: { "content-type": "image/png" } }));
    const png = await fetchImageFromUrl("https://example.com/a.png");
    expect(png).toMatchObject({ ok: false, error: { code: "not-jpeg" } });
    if (!png.ok) expect(png.error.message).toContain("PNG image");

    stubFetch(new Response("", { headers: { "content-type": "image/svg+xml" } }));
    const svg = await fetchImageFromUrl("https://example.com/a.svg");
    if (!svg.ok) expect(svg.error.message).toContain("SVG image");
  });

  it("refuses images over the size limit, by header or by counting", async () => {
    stubFetch(new Response("", { headers: { "content-length": String(MAX_IMAGE_BYTES + 1) } }));
    expect(await errorCode("https://example.com/a.jpg")).toBe("too-large");

    // No size header: the body is counted as it arrives.
    const chunk = new Uint8Array(16 * 1024 * 1024);
    let sent = 0;
    const endless = new ReadableStream<Uint8Array>({
      pull(controller) {
        sent += chunk.byteLength;
        controller.enqueue(chunk);
      },
    });
    stubFetch(new Response(endless));
    expect(await errorCode("https://example.com/a.jpg")).toBe("too-large");
    expect(sent).toBeLessThanOrEqual(MAX_IMAGE_BYTES + 2 * chunk.byteLength);
  });
});

describe("fileNameFrom", () => {
  const name = (url: string) => fileNameFrom(new URL(url));

  it("takes the last part of the path, decoded", () => {
    expect(name("https://example.com/a/b/P1010042.JPG")).toBe("P1010042.JPG");
    expect(name("https://example.com/a/My%20Photo.jpg?raw=1#x")).toBe("My Photo.jpg");
    expect(name("https://example.com/folder/")).toBe("folder");
  });

  it("falls back to a plain name", () => {
    expect(name("https://example.com/")).toBe("photo.jpg");
    expect(name("https://example.com/100%.jpg")).toBe("100%.jpg");
  });
});
