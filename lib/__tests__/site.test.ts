import { describe, expect, it } from "vitest";
import { pageMetadata, SITE_DESCRIPTION, SITE_NAME, SOCIAL_IMAGE } from "../site";

describe("pageMetadata", () => {
  it("gives a page its own canonical URL and Open Graph URL", () => {
    const metadata = pageMetadata({ path: "/about", title: "About", description: "What it is." });
    expect(metadata.alternates?.canonical).toBe("/about");
    expect(metadata.openGraph).toMatchObject({
      url: "/about",
      siteName: SITE_NAME,
      title: `About · ${SITE_NAME}`,
      description: "What it is.",
      images: [SOCIAL_IMAGE],
    });
  });

  it("uses the site's name and description on the home page", () => {
    const metadata = pageMetadata({ path: "/" });
    expect(metadata.description).toBe(SITE_DESCRIPTION);
    expect(metadata.openGraph).toMatchObject({ title: SITE_NAME, description: SITE_DESCRIPTION });
  });

  // A key set to undefined would replace the layout's value (metadata merges shallowly).
  it("never sets a key to undefined", () => {
    const metadata = pageMetadata({ path: "/" });
    expect("title" in metadata).toBe(false);
    expect(Object.values(metadata).every((value) => value !== undefined)).toBe(true);
  });
});
