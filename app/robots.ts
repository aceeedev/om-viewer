import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

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
