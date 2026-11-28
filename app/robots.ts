import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Every crawler is welcome, AI crawlers included (for training, search and assistants), so the site
 * shows up in search engines and AI answers. Only the sample photos are kept out.
 *
 * A crawler named in a group of its own follows only that group and ignores the "*" one, so any group
 * added here has to keep the samples out too.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The sample photos belong to their photographers: keep copies of them out of image search.
      disallow: "/samples/",
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  };
}
