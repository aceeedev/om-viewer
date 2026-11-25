/** The site's name as a wordmark: Archivo, wide and extra-bold. */
const WORDMARK = "font-extrabold font-stretch-expanded";

/** One centered column, the same width in the header, the page and the footer. */
export const CONTAINER = "mx-auto w-full max-w-6xl px-6";

/**
 * The black bar along the top, with the site's name linking home. A plain link, not next/link:
 * the site is one page, and a full load is what clears the viewer back to its empty state.
 */
export function SiteHeader() {
  return (
    <header className="bg-black text-white">
      <div className={`${CONTAINER} flex h-14 items-center`}>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load is the point: it resets the viewer */}
        <a href="/" className={`${WORDMARK} text-lg`}>
          OM Recipe Viewer
        </a>
      </div>
    </header>
  );
}

/** The black band along the bottom: the site's name, and that the site is unofficial. */
export function SiteFooter() {
  return (
    <footer className="bg-black text-sm text-white/70">
      <div className={`${CONTAINER} py-8`}>
        <p className={`${WORDMARK} text-white`}>OM Recipe Viewer</p>
      </div>
      <div className="border-t border-white/15">
        <p className={`${CONTAINER} py-4 text-xs text-white/50`}>
          An independent tool, not affiliated with or endorsed by OM Digital Solutions. OM SYSTEM and PEN are
          trademarks of their owners.
        </p>
      </div>
    </footer>
  );
}
