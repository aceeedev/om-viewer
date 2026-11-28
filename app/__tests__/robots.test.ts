import { describe, expect, it } from "vitest";
import robots from "../robots";

const groups = () => [robots().rules].flat();
const list = (value: string | string[] | undefined) => [value ?? []].flat();

describe("robots.txt", () => {
  it("lets every crawler in, AI crawlers included", () => {
    const everyone = groups().find((group) => list(group.userAgent).includes("*"));
    expect(list(everyone?.allow)).toContain("/");
  });

  // A crawler named in its own group ignores the "*" group, so each group needs the rule.
  it("keeps every crawler out of the sample photos", () => {
    for (const group of groups()) expect(list(group.disallow)).toContain("/samples/");
  });

  it("points to the sitemap", () => {
    expect(robots().sitemap).toBe("https://omviewer.com/sitemap.xml");
  });
});
