import Link from "next/link";
import type { ReactNode } from "react";

/** The site's name as a wordmark: Archivo, wide and extra-bold. */
const WORDMARK = "font-extrabold font-stretch-expanded";

/** One centered column, the same width in the header, the page and the footer. */
export const CONTAINER = "mx-auto w-full max-w-6xl px-6";

/** A white focus outline, for links on the black header and footer. */
const FOCUS_RING_ON_BLACK =
  "rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** A link in the header or footer: dimmed white, full white on hover. */
const NAV_LINK = `text-white/70 transition-colors hover:text-white ${FOCUS_RING_ON_BLACK}`;

/** The site's other pages, linked from the footer on every page. */
const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms and Conditions" },
] as const;

/**
 * The black bar along the top: the site's name linking home on the left, About on the right. The home
 * link is a plain link, not next/link: a full load is what clears the viewer back to its empty state.
 */
export function SiteHeader() {
  return (
    <header className="bg-black text-white">
      <div className={`${CONTAINER} flex h-14 items-center justify-between gap-6`}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load is the point: it resets the viewer */}
        <a href="/" className={`${WORDMARK} text-lg ${FOCUS_RING_ON_BLACK}`}>
          OM Recipe Viewer
        </a>
        <nav aria-label="Main">
          <Link href="/about" className={`text-sm font-medium ${NAV_LINK}`}>
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}

/**
 * The off-white band at the top of a page with its headline centered, as on OM System's own pages.
 * `children` is the line of text under the headline.
 */
export function PageIntro({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <section className="border-b border-zinc-200 bg-zinc-50">
      <div className={`${CONTAINER} flex flex-col items-center gap-4 py-12 text-center sm:py-16`}>
        <h1 className="max-w-3xl text-3xl leading-[1.12] font-extrabold font-stretch-expanded text-balance sm:text-4xl">
          {title}
        </h1>
        {children && <p className="max-w-2xl text-zinc-600">{children}</p>}
      </div>
    </section>
  );
}

/**
 * The black band along the bottom: the site's name with the note that it's unofficial under it, and
 * links to the site's other pages beside them (below them on narrow screens).
 */
export function SiteFooter() {
  return (
    <footer className="bg-black text-sm text-white/70">
      <div className={`${CONTAINER} flex flex-col gap-6 py-8 sm:flex-row sm:items-start sm:justify-between`}>
        <div className="flex max-w-md flex-col gap-2">
          <p className={`${WORDMARK} text-white`}>OM Recipe Viewer</p>
          <p className="text-xs text-white/50">
            An independent tool, not affiliated with or endorsed by OM Digital Solutions. OM SYSTEM and PEN are
            trademarks of their owners.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link href={href} className={NAV_LINK}>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
