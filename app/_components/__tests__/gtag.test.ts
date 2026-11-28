import { describe, expect, it } from "vitest";
import {
  analyticsCookieNames,
  cookieDomains,
  GTAG_CONFIG,
  gtagScriptUrl,
  startAnalytics,
  stopAnalytics,
  type GtagWindow,
} from "../gtag";

const ID = "G-TEST123";

/** A window with nothing from Google on it yet. Indexable, to read the `ga-disable-…` flag. */
const fakeWindow = (): GtagWindow & Record<string, unknown> => ({});

/** A document holding `cookies`, which records every cookie the code writes. */
function fakeDocument(hostname: string, cookies: string[]) {
  const writes: string[] = [];
  const doc = {
    location: { hostname },
    get cookie() {
      return cookies.join("; ");
    },
    set cookie(value: string) {
      writes.push(value);
    },
  };
  return { doc, writes };
}

/** The queued commands as plain arrays. */
const commands = (win: GtagWindow) => (win.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));

describe("gtagScriptUrl", () => {
  it("loads gtag.js for the measurement ID from Google's tag server", () => {
    expect(gtagScriptUrl(ID)).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
    expect(gtagScriptUrl("G-A&B")).toBe("https://www.googletagmanager.com/gtag/js?id=G-A%26B");
  });
});

describe("startAnalytics", () => {
  it("queues the Google tag's setup with Google signals and ad personalization off", () => {
    const win = fakeWindow();
    startAnalytics(win, ID);
    const [js, config] = commands(win);
    expect(js[0]).toBe("js");
    expect(js[1]).toBeInstanceOf(Date);
    expect(config).toEqual(["config", ID, { allow_google_signals: false, allow_ad_personalization_signals: false }]);
    expect(config[2]).toBe(GTAG_CONFIG);
    expect(win[`ga-disable-${ID}`]).toBe(false);
  });

  it("queues commands as `arguments` objects, the only form gtag.js runs", () => {
    const win = fakeWindow();
    startAnalytics(win, ID);
    for (const entry of win.dataLayer!) {
      expect(Object.prototype.toString.call(entry)).toBe("[object Arguments]");
    }
  });

  it("keeps commands that were queued before it", () => {
    const earlier = { event: "earlier" };
    const win: GtagWindow = { dataLayer: [earlier] };
    startAnalytics(win, ID);
    expect(win.dataLayer![0]).toBe(earlier);
    expect(win.dataLayer).toHaveLength(3);
  });

  it("turns back on after declining, counting the page again without setting up twice", () => {
    const win = fakeWindow();
    const { doc } = fakeDocument("omviewer.com", []);
    startAnalytics(win, ID);
    const gtag = win.gtag;
    stopAnalytics(win, doc, ID);
    startAnalytics(win, ID);
    expect(win.gtag).toBe(gtag);
    expect(commands(win).map(([command]) => command)).toEqual(["js", "config", "config"]);
    expect(win[`ga-disable-${ID}`]).toBe(false);
  });
});

describe("stopAnalytics", () => {
  it("tells gtag.js to stop sending", () => {
    const win = fakeWindow();
    startAnalytics(win, ID);
    stopAnalytics(win, fakeDocument("omviewer.com", []).doc, ID);
    expect(win[`ga-disable-${ID}`]).toBe(true);
  });

  it("deletes Google Analytics' cookies on the host and every domain above it", () => {
    const { doc, writes } = fakeDocument("www.omviewer.com", ["_ga=GA1.1.123.456", "_ga_TEST123=GS2.1.s1"]);
    stopAnalytics(fakeWindow(), doc, ID);
    for (const name of ["_ga", "_ga_TEST123"]) {
      expect(writes).toContain(`${name}=; Max-Age=0; Path=/`);
      expect(writes).toContain(`${name}=; Max-Age=0; Path=/; Domain=www.omviewer.com`);
      expect(writes).toContain(`${name}=; Max-Age=0; Path=/; Domain=omviewer.com`);
    }
  });

  it("leaves other cookies alone, and writes nothing when there are no analytics cookies", () => {
    const { doc, writes } = fakeDocument("omviewer.com", ["theme=dark", "_gallery=1"]);
    stopAnalytics(fakeWindow(), doc, ID);
    expect(writes).toEqual([]);
  });

  it("is safe before Google Analytics ever started", () => {
    const win = fakeWindow();
    stopAnalytics(win, fakeDocument("omviewer.com", []).doc, ID);
    expect(win.dataLayer).toBeUndefined();
    expect(win.gtag).toBeUndefined();
  });
});

describe("analyticsCookieNames", () => {
  it("finds the Google tag's cookies", () => {
    const header = "_ga=GA1.1.1.2; _ga_ABC123=GS2; _gid=GA1; _gat=1; _gat_UA-1=1; _gcl_au=1.1; other=x";
    expect(analyticsCookieNames(header)).toEqual(["_ga", "_ga_ABC123", "_gid", "_gat", "_gat_UA-1", "_gcl_au"]);
  });

  it("skips cookies that only start with the same letters", () => {
    expect(analyticsCookieNames("_gallery=1; ga=1; _gaming=2; __ga=3")).toEqual([]);
  });

  it("handles no cookies", () => {
    expect(analyticsCookieNames("")).toEqual([]);
  });
});

describe("cookieDomains", () => {
  it("lists the hostname and each domain above it", () => {
    expect(cookieDomains("www.omviewer.com")).toEqual(["www.omviewer.com", "omviewer.com", "com"]);
    expect(cookieDomains("omviewer.com")).toEqual(["omviewer.com", "com"]);
    expect(cookieDomains("localhost")).toEqual(["localhost"]);
  });
});
