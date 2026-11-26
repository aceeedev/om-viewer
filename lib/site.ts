import type { Metadata } from "next";

/** The site's one official address. Canonical links, the sitemap and social cards all point here. */
export const SITE_URL = "https://omviewer.com";

export const SITE_NAME = "OM Recipe Viewer";

export const SITE_DESCRIPTION =
  "See the Color Profile, Monochrome Profile and picture settings stored in an OM System JPEG. Runs entirely in your browser.";

export const AUTHOR = {
  name: "Andrew Collins",
  url: "https://www.linkedin.com/in/andrew-michael-collins/",
} as const;

export const REPO_URL = "https://github.com/aceeedev/om-viewer";
export const REPO_ISSUES_URL = `${REPO_URL}/issues`;

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
    },
  };
}
