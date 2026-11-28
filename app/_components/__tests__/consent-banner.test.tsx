import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsentBanner, ConsentPanel, type BannerStatus } from "../consent-banner";
import { CookieSettingsButton } from "../cookie-settings-button";

const noop = () => {};
const render = (status: BannerStatus, onClose?: () => void) =>
  renderToStaticMarkup(<ConsentPanel status={status} onChoose={noop} onClose={onClose} />);

/** Each button's text and class, in order. */
const buttons = (html: string) =>
  [...html.matchAll(/<button type="button" class="([^"]*)">([^<]*)<\/button>/g)].map(([, className, text]) => ({
    text,
    className,
  }));

/** The text of the element with this id. */
const textOf = (html: string, id: string) => new RegExp(`id="${id}"[^>]*>([^<]*)<`).exec(html)?.[1];

describe("ConsentBanner", () => {
  it("isn't in the server's HTML, which is the same for every visitor", () => {
    expect(renderToStaticMarkup(<ConsentBanner />)).toBe("");
  });
});

describe("ConsentPanel", () => {
  it("asks first, with Accept and Decline looking the same", () => {
    const html = render("undecided");
    expect(html).toContain("Allow cookies?");
    expect(html).toContain("only for Google Analytics");
    expect(html).toContain("It never sees your photos or anything in them.");
    const [accept, decline, ...rest] = buttons(html);
    expect([accept.text, decline.text]).toEqual(["Accept", "Decline"]);
    expect(accept.className).toBe(decline.className);
    expect(rest).toEqual([]);
  });

  it("offers to turn analytics off once it's on", () => {
    const html = render("granted", noop);
    expect(html).toContain("Cookies are on");
    expect(buttons(html).map((b) => b.text)).toEqual(["Turn off", "Close"]);
  });

  it("offers to turn analytics on once it's off", () => {
    const html = render("denied", noop);
    expect(html).toContain("Cookies are off");
    expect(buttons(html).map((b) => b.text)).toEqual(["Turn on", "Close"]);
  });

  it("explains that Global Privacy Control keeps analytics off, with nothing to choose", () => {
    const html = render("gpc", noop);
    expect(html).toContain("Global Privacy Control");
    expect(buttons(html).map((b) => b.text)).toEqual(["Close"]);
  });

  it("has a Close button only when it can close", () => {
    expect(buttons(render("granted")).map((b) => b.text)).toEqual(["Turn off"]);
  });

  it("links to the Privacy Policy in every state", () => {
    for (const status of ["undecided", "granted", "denied", "gpc"] as const) {
      expect(render(status)).toMatch(/<a [^>]*href="\/privacy"[^>]*>Privacy Policy<\/a>/);
    }
  });

  it("is a region named by its title and described by its text, for screen readers", () => {
    const html = render("undecided");
    const labelledBy = /<section[^>]*aria-labelledby="([^"]+)"/.exec(html)?.[1];
    const describedBy = /<section[^>]*aria-describedby="([^"]+)"/.exec(html)?.[1];
    expect(textOf(html, labelledBy!)).toBe("Allow cookies?");
    expect(textOf(html, describedBy!)).toMatch(/^They&#x27;re only for Google Analytics/);
    // Focusable from script when opened from Cookie settings, but not a stop in the tab order.
    expect(html).toMatch(/<section[^>]*tabindex="-1"/);
  });

  it("doesn't add a heading before the page's own h1", () => {
    expect(render("undecided")).not.toMatch(/<h\d/);
  });
});

describe("CookieSettingsButton", () => {
  it("is a button, collapsed on the server", () => {
    const html = renderToStaticMarkup(<CookieSettingsButton className="x" />);
    expect(html).toBe('<button type="button" aria-expanded="false" class="x">Cookie settings</button>');
  });
});

describe("SiteFooter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  /** The footer, built with NEXT_PUBLIC_GA_ID set to `id` (read when lib/site loads). */
  async function footerWith(id: string | undefined) {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", id);
    vi.resetModules();
    const { SiteFooter } = await import("../site-chrome");
    return renderToStaticMarkup(<SiteFooter />);
  }

  it("has Cookie settings when the site has analytics", async () => {
    expect(await footerWith("G-TEST123")).toContain(">Cookie settings</button>");
  });

  it("leaves it out when the site has no analytics", async () => {
    expect(await footerWith(undefined)).not.toContain("Cookie settings");
    expect(await footerWith("  ")).not.toContain("Cookie settings");
  });
});
