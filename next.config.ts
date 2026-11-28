import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * Content-Security-Policy, set as a plain header so the page stays static. Nonces would force every
 * request to be rendered on the server and don't work with partial prerendering (cacheComponents).
 * Next's own inline scripts and styles need 'unsafe-inline' without nonces; the rest still locks the
 * page down: nothing loads from other sites except what a pasted image link fetches, and Google
 * Analytics once a visitor accepts it.
 *
 * Google Analytics needs only the hosts Google lists for GA without ad features
 * (https://developers.google.com/tag-platform/security/guides/csp). Google signals and ad
 * personalization are off, so the ad hosts (doubleclick.net, google.<TLD>) aren't allowed.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // gtag.js comes from Google's tag server. Dev mode's hot reload evaluates code at runtime.
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // blob: is the preview of the opened photo. Google Analytics sends some hits as image requests.
  "img-src 'self' blob: data: https://www.googletagmanager.com https://*.google-analytics.com",
  // next/font self-hosts the fonts at build time.
  "font-src 'self'",
  // Opening a photo by link downloads it in the browser, from any https site, which also covers
  // Google Analytics' hits. Dev also allows http: for links on this machine, e.g. a local test server.
  `connect-src 'self' https:${isDev ? " http:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'", // no embedding in other sites' frames (clickjacking)
  // Would rewrite http:// requests to https:// on the plain-http dev server too.
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/** Sent on every response: the CSP and the other standard security headers. */
const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  // Other sites never learn which page a visitor came from; our own pages still do. Photos opened by
  // link and links to other sites already opt out one by one; this covers anything added later. Not
  // "no-referrer", which also sends `Origin: null` on posts to our own site.
  { key: "Referrer-Policy", value: "same-origin" },
  // Features the site never uses, off for every page and anything embedded in one. Writing to the
  // clipboard isn't listed, so copying text still works.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Trust the Content-Type we send: a mislabelled file is never run as a script or style.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Cuts the link to a window from another site that opens this one, or that this one opens, so it
  // can't redirect or probe the page. Also gives the site its own process in Chrome on Android.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HTTPS only, on this domain and every subdomain, for 2 years. Vercel sends a version without
  // subdomains on its own. No `preload`: it lets anyone add the domain to the browsers' built-in list,
  // which takes months to leave. Production only, so an HTTPS dev server doesn't pin localhost to HTTPS.
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

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
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
