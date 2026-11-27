import type { Metadata } from "next";
import Link from "next/link";
import { CONTAINER, PageIntro } from "./_components/site-chrome";
import { FOCUS_RING } from "./_components/text-link";

// No canonical URL or Open Graph tags: this page has no address of its own. Next adds noindex itself.
export const metadata: Metadata = {
  title: "Page not found",
};

/** Shown for any URL the site doesn't have, inside the root layout's header and footer. */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col">
      <PageIntro title="Page not found">
        There&apos;s no page at this address. The link may be mistyped, or the page may have moved.
      </PageIntro>
      <div className={`${CONTAINER} flex justify-center py-10 sm:py-14`}>
        <Link
          href="/"
          className={
            "rounded-md bg-black px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-zinc-800 " +
            FOCUS_RING
          }
        >
          Go to the viewer
        </Link>
      </div>
    </main>
  );
}
