import { describe, expect, it } from "vitest";
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

  it("loads scripts, styles and fonts only from this site", async () => {
    const csp = await policy();
    expect(csp.get("default-src")).toEqual(["'self'"]);
    expect(csp.get("script-src")).toEqual(["'self'", "'unsafe-inline'"]); // no 'unsafe-eval' outside dev
    expect(csp.get("font-src")).toEqual(["'self'"]);
  });

  it("blocks plugins, <base> rewrites, outside form targets and framing", async () => {
    const csp = await policy();
    expect(csp.get("object-src")).toEqual(["'none'"]);
    expect(csp.get("base-uri")).toEqual(["'self'"]);
    expect(csp.get("form-action")).toEqual(["'self'"]);
    expect(csp.get("frame-ancestors")).toEqual(["'none'"]);
  });
});
