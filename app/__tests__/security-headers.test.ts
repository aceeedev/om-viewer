import { describe, expect, it } from "vitest";
import { gtagScriptUrl } from "@/app/_components/gtag";
import nextConfig from "@/next.config";

/** The production policy (tests don't run with NODE_ENV=development), as directive → sources. */
async function policy(): Promise<Map<string, string[]>> {
  const rules = (await nextConfig.headers?.()) ?? [];
  const header = rules
    .find((rule) => rule.source === "/:path*")
    ?.headers.find((h) => h.key === "Content-Security-Policy");
  if (!header) throw new Error("no Content-Security-Policy for every path");
  return new Map(
    header.value.split(";").map((directive) => {
      const [name, ...sources] = directive.trim().split(/\s+/);
      return [name, sources];
    }),
  );
}

describe("Content-Security-Policy", () => {
  it("lets a pasted link be downloaded from any https site, and nothing over plain http", async () => {
    const csp = await policy();
    expect(csp.get("connect-src")).toEqual(["'self'", "https:"]);
    expect(csp.has("upgrade-insecure-requests")).toBe(true);
  });

  it("allows the photo preview, which is a blob: URL", async () => {
    expect((await policy()).get("img-src")).toContain("blob:");
  });

  it("loads scripts only from this site and Google's tag server, and fonts only from this site", async () => {
    const csp = await policy();
    expect(csp.get("default-src")).toEqual(["'self'"]);
    // No 'unsafe-eval' outside dev.
    expect(csp.get("script-src")).toEqual(["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"]);
    expect(csp.get("font-src")).toEqual(["'self'"]);
  });

  it("allows Google Analytics' script and hits", async () => {
    const csp = await policy();
    expect(csp.get("script-src")).toContain(new URL(gtagScriptUrl("G-TEST123")).origin);
    expect(csp.get("img-src")).toEqual(
      expect.arrayContaining(["https://www.googletagmanager.com", "https://*.google-analytics.com"]),
    );
    expect(csp.get("connect-src")).toContain("https:");
  });

  it("doesn't allow Google's ad hosts, since Google signals and ad personalization are off", async () => {
    const sources = [...(await policy()).values()].flat();
    expect(sources.filter((source) => /doubleclick|googlesyndication|\.google\.com/.test(source))).toEqual([]);
  });

  it("blocks plugins, <base> rewrites, outside form targets and framing", async () => {
    const csp = await policy();
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("base-uri")).toEqual(["'self'"]);
    expect(csp.get("form-action")).toEqual(["'self'"]);
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
  });
});
