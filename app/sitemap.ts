import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Every page, for search engines. Add new pages here. */
const PAGES = ["/", "/about", "/privacy", "/terms"] as const;

// No lastModified, changeFrequency or priority: Google ignores the last two, and the build time isn't
// when a page last changed.
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map((path) => ({ url: new URL(path, SITE_URL).href }));
}
