/** Google's tag server, where gtag.js comes from. The CSP in next.config.ts allows scripts from it. */
export const GTAG_ORIGIN = "https://www.googletagmanager.com";

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    /** The Google tag's command queue. gtag.js reads it once it loads, and every command after. */
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

/** The parts of `window` the Google tag uses, so tests can pass a plain object. */
export type GtagWindow = Pick<Window, "dataLayer" | "gtag">;

/** The parts of `document` needed to find and delete Google Analytics' cookies. */
export interface CookieDocument {
  cookie: string;
  location: { hostname: string };
}

/**
 * Sent with every `config`. Google signals and ad personalization are off: visits are never tied to
 * visitors' Google accounts or used for ads, which the Privacy Policy promises.
 */
export const GTAG_CONFIG = {
  allow_google_signals: false,
  allow_ad_personalization_signals: false,
} as const;

export function gtagScriptUrl(measurementId: string): string {
  return `${GTAG_ORIGIN}/gtag/js?id=${encodeURIComponent(measurementId)}`;
}

/** The window property that tells gtag.js to stop sending anything for this measurement ID. */
function disableKey(measurementId: string): string {
  return `ga-disable-${measurementId}`;
}

/**
 * Turns Google Analytics on: queues the Google tag's setup for gtag.js to run once it loads, and
 * counts a page view of the page the visitor is on. GA's enhanced measurement counts the pages after
 * it, since links between pages change the history without a full load.
 *
 * Also turns it back on after `stopAnalytics`, when a visitor declines and then accepts again.
 */
export function startAnalytics(win: GtagWindow, measurementId: string): void {
  Object.assign(win, { [disableKey(measurementId)]: false });
  if (!win.gtag) {
    const dataLayer = (win.dataLayer ??= []);
    win.gtag = function gtag() {
      // gtag.js only runs commands pushed as an `arguments` object. A rest-parameter array is ignored.
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments);
    };
    win.gtag("js", new Date());
  }
  win.gtag("config", measurementId, GTAG_CONFIG);
}

/**
 * Turns Google Analytics off: gtag.js, if it loaded, stops sending anything, and its cookies are
 * deleted. Also deletes cookies left from an earlier visit, as when the visitor accepted before and
 * now has Global Privacy Control on. Safe to call when Google Analytics never started.
 */
export function stopAnalytics(win: GtagWindow, doc: CookieDocument, measurementId: string): void {
  Object.assign(win, { [disableKey(measurementId)]: true });
  for (const name of analyticsCookieNames(doc.cookie)) {
    doc.cookie = `${name}=; Max-Age=0; Path=/`;
    for (const domain of cookieDomains(doc.location.hostname)) {
      doc.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}`;
    }
  }
}

/**
 * The Google tag's cookies: `_ga` and `_ga_<stream>` from Google Analytics 4, `_gid` and `_gat` from
 * older versions, and the `_gcl_` ad-click cookies it can set when linked to Google Ads.
 */
const ANALYTICS_COOKIE = /^(?:_ga|_gid|_gat)(?:_|$)|^_gcl_/;

/** The names of the Google tag's cookies in a `document.cookie` string. */
export function analyticsCookieNames(cookieHeader: string): string[] {
  return cookieHeader
    .split(";")
    .map((pair) => pair.split("=", 1)[0].trim())
    .filter((name) => ANALYTICS_COOKIE.test(name));
}

/**
 * The hostname and each domain above it: "www.omviewer.com" gives "www.omviewer.com", "omviewer.com"
 * and "com". The Google tag sets its cookies on the highest domain the browser accepts, and a cookie is
 * only deleted with the domain it was set with, so each one is tried. Browsers ignore the ones a site
 * can't set cookies on, like "com".
 */
export function cookieDomains(hostname: string): string[] {
  const labels = hostname.split(".");
  return labels.map((_, i) => labels.slice(i).join("."));
}
