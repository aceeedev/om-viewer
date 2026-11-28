import type { Metadata } from "next";

/** The site's one official address. Canonical links, the sitemap and social cards all point here. */
export const SITE_URL = "https://omviewer.com";

export const SITE_NAME = "OM Recipe Viewer";

/** The name under a home screen icon. Phones cut labels off after about 12 characters. */
export const SITE_SHORT_NAME = "OM Viewer";

/** The header's black. Browsers that tint their toolbar to match the page use it. */
export const THEME_COLOR = "#000000";

export const SITE_DESCRIPTION =
  "See the Color Profile, Monochrome Profile and picture settings stored in an OM System JPEG. Runs entirely in your browser.";

export const AUTHOR = {
  name: "Andrew Collins",
  url: "https://www.linkedin.com/in/andrew-michael-collins/",
} as const;

export const REPO_URL = "https://github.com/aceeedev/om-viewer";
export const REPO_ISSUES_URL = `${REPO_URL}/issues`;

/** GitHub's private vulnerability report form for the repo (turned on in its settings). */
export const SECURITY_REPORT_URL = `${REPO_URL}/security/advisories/new`;
/** The repo's SECURITY.md, as GitHub shows it. */
export const SECURITY_POLICY_URL = `${REPO_URL}/blob/main/SECURITY.md`;

/**
 * The social preview image drawn by app/opengraph-image.tsx. Listed on every page by pageMetadata(): Next
 * only adds it to the home page on its own, since a page's own `openGraph` replaces the inherited one.
 */
export const SOCIAL_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  type: "image/png",
  alt: `${SITE_NAME}: see the Color Profile and picture settings stored in an OM System photo`,
} as const;

/** The layout's title template: "About" becomes "About · OM Recipe Viewer". */
export const TITLE_TEMPLATE = `%s · ${SITE_NAME}`;

/**
 * One page's metadata, with its canonical URL and Open Graph tags. `path` is the page's own path,
 * e.g. "/about". Leave out `title` on the home page, which uses the site's name, and `description` to
 * use the site's.
 *
 * Every page needs its own: Next merges metadata shallowly, so an `openGraph` set here replaces the
 * layout's whole `openGraph`, and a canonical URL set in the layout would point every page at "/".
 * Keys are never set to undefined, which would also replace the layout's value.
 */
export function pageMetadata({
  path,
  title,
  description = SITE_DESCRIPTION,
}: {
  path: string;
  title?: string;
  description?: string;
}): Metadata {
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      // The title template doesn't apply here, and a shared card often shows only this title.
      title: title ? TITLE_TEMPLATE.replace("%s", title) : SITE_NAME,
      description,
      images: [SOCIAL_IMAGE],
    },
  };
}
