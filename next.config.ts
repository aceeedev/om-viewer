import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy, set as a plain header so the page stays static. Nonces would force every
 * request to be rendered on the server and don't work with partial prerendering (cacheComponents).
 * Next's own inline scripts and styles need 'unsafe-inline' without nonces; the rest still locks the
 * page down: nothing loads from other sites except what a pasted image link fetches.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Dev mode's hot reload evaluates code at runtime.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // blob: is the preview of the opened photo.
  "img-src 'self' blob: data:",
  // next/font self-hosts the fonts at build time.
  "font-src 'self'",
  // Opening a photo by link downloads it in the browser, from any https site. Dev also allows http:
  // for links on this machine, e.g. a local test server.
  `connect-src 'self' https:${isDev ? " http:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'", // no embedding in other sites' frames (clickjacking)
  // Would rewrite http:// requests to https:// on the plain-http dev server too.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy }],
      },
    ];
  },
};

export default nextConfig;
