import { afterEach, describe, expect, it, vi } from "vitest";
import { SECURITY_TXT_EXPIRES_DAYS, securityTxt } from "../security-txt";
import { SECURITY_POLICY_URL, SECURITY_REPORT_URL } from "../site";

// cacheLife only works inside a Next.js build; here the route just runs its helper.
vi.mock("next/cache", () => ({ cacheLife: () => {} }));

const NOW = new Date("2026-11-28T12:34:56.789Z");

/** The file's fields by name, checking each line is `Name: value`. */
function fields(text: string): Map<string, string> {
  expect(text.endsWith("\n")).toBe(true);
  const lines = text.slice(0, -1).split("\n");
  for (const line of lines) expect(line).toMatch(/^[A-Za-z-]+: \S+$/);
  return new Map(lines.map((line) => line.split(": ") as [string, string]));
}

describe("securityTxt", () => {
  it("points to the private report form and the policy, over https", () => {
    const file = fields(securityTxt(NOW));
    expect(file.get("Contact")).toBe(SECURITY_REPORT_URL);
    expect(file.get("Policy")).toBe(SECURITY_POLICY_URL);
    expect(file.get("Canonical")).toBe("https://omviewer.com/.well-known/security.txt");
    expect(file.get("Preferred-Languages")).toBe("en");
    for (const name of ["Contact", "Policy", "Canonical"]) expect(file.get(name)).toMatch(/^https:\/\//);
  });

  it("expires months ahead, but under a year, as RFC 9116 recommends", () => {
    const expires = fields(securityTxt(NOW)).get("Expires")!;
    expect(expires).toBe("2027-05-27T12:34:56Z"); // RFC 3339, to the second
    const days = (Date.parse(expires) - NOW.getTime()) / (24 * 60 * 60 * 1000);
    expect(days).toBeCloseTo(SECURITY_TXT_EXPIRES_DAYS, 0);
    expect(days).toBeGreaterThan(90);
    expect(days).toBeLessThan(365);
  });
});

describe("GET /.well-known/security.txt", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("serves the current file as UTF-8 plain text", async () => {
    vi.useFakeTimers({ now: NOW });
    const { GET } = await import("@/app/.well-known/security.txt/route");
    const response = await GET();
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toBe(securityTxt(NOW));
  });
});
