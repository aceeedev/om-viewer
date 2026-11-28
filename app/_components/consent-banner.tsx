"use client";

import Link from "next/link";
import { useEffect, useId, useRef, type Ref } from "react";
import { bannerShown, consentStore, useConsent, type ConsentChoice, type ConsentStatus } from "./consent";
import { FOCUS_RING, TEXT_LINK } from "./text-link";

/** What the banner can show: every status but `unknown`, when it's hidden. */
export type BannerStatus = Exclude<ConsentStatus, "unknown">;

/** Accept and Decline look the same, so neither is easier to pick. Turn on and Turn off use it too. */
const BUTTON = `rounded-md bg-black px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-800 ${FOCUS_RING}`;

/** Close changes nothing, so it's quieter: an outline instead of a fill. */
const CLOSE_BUTTON =
  `rounded-md border-[1.5px] border-zinc-500 px-5 py-2 text-sm font-bold transition-colors hover:border-black ${FOCUS_RING}`;

/**
 * What the cookies are for. Google Analytics' are the site's only cookies (the answer itself is kept in
 * local storage), so the banner can ask about cookies as a whole. Don't claim "no personal data": the
 * cookie's visitor ID, the IP-based location and the device details all count as personal data.
 */
const WHAT_THEY_DO =
  "They're only for Google Analytics, to count visits and see how the site is used. It never sees your photos or anything in them.";

/** The banner's title and text for each status. The Privacy Policy has the details. */
const COPY: Record<BannerStatus, { title: string; text: string }> = {
  undecided: { title: "Allow cookies?", text: WHAT_THEY_DO },
  granted: { title: "Cookies are on", text: WHAT_THEY_DO },
  denied: { title: "Cookies are off", text: WHAT_THEY_DO },
  gpc: {
    title: "Cookies are off",
    text: "Your browser sends a Global Privacy Control signal, so Google Analytics stays off and the site sets no cookies.",
  },
};

/**
 * Asks whether the site may set cookies (Google Analytics' cookies, its only ones), until the visitor
 * answers, and shows their answer again
 * when they open Cookie settings in the footer. It isn't in the server's HTML: the answer is only
 * known in the browser, and leaving it out keeps the page the same for everyone.
 *
 * The root layout puts it first in the page, so keyboard and screen reader users reach it before
 * anything else, though it shows at the bottom of the screen.
 */
export function ConsentBanner() {
  const snapshot = useConsent();
  const { status, settingsOpen } = snapshot;
  const panel = useRef<HTMLElement>(null);
  // What had focus when the settings opened (the footer link), to go back to when they close.
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panel.current?.focus();
  }, [settingsOpen]);

  if (status === "unknown" || !bannerShown(snapshot)) return null;

  /** Runs `action`, then puts focus back where it was if the visitor came from Cookie settings. */
  function finish(action: () => void) {
    const returnTo = settingsOpen ? opener.current : null;
    opener.current = null;
    action();
    returnTo?.focus();
  }

  return (
    <ConsentPanel
      ref={panel}
      status={status}
      onChoose={(choice) => finish(() => consentStore.choose(choice))}
      // Before an answer there's nothing to go back to, so the only way out is to answer.
      onClose={settingsOpen && status !== "undecided" ? () => finish(consentStore.closeSettings) : undefined}
    />
  );
}

/**
 * The banner itself, for one status. `onClose`, when given, adds a Close button and closes on Escape.
 * Exported for tests.
 */
export function ConsentPanel({
  status,
  onChoose,
  onClose,
  ref,
}: {
  status: BannerStatus;
  onChoose: (choice: ConsentChoice) => void;
  onClose?: () => void;
  ref?: Ref<HTMLElement>;
}) {
  const titleId = useId();
  const textId = useId();
  const { title, text } = COPY[status];

  return (
    <section
      ref={ref}
      // Focused when opened from Cookie settings, so screen readers read it out. Not in the tab order.
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={textId}
      onKeyDown={(event) => {
        if (event.key === "Escape" && onClose) onClose();
      }}
      className={
        // Floats over the page, the footer included, and takes no space of its own. The margins keep it
        // clear of a phone's home indicator, and of the notch when the phone is sideways: they add each
        // safe-area inset to its offset from that edge, and are 0 where nothing covers the page.
        "fixed inset-x-3 bottom-3 z-50 flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-4 text-sm " +
        "mb-[env(safe-area-inset-bottom)] ml-[env(safe-area-inset-left)] mr-[env(safe-area-inset-right)] " +
        "shadow-lg outline-none sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-96 sm:p-5"
      }
    >
      {/* Not a heading: the banner comes before the page's own h1, and would upset its outline. */}
      <p id={titleId} className="font-extrabold font-stretch-expanded">
        {title}
      </p>
      <p id={textId} className="leading-relaxed text-zinc-700">
        {text}
      </p>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {status === "undecided" && (
          <>
            <button type="button" className={BUTTON} onClick={() => onChoose("granted")}>
              Accept
            </button>
            <button type="button" className={BUTTON} onClick={() => onChoose("denied")}>
              Decline
            </button>
          </>
        )}
        {status === "granted" && (
          <button type="button" className={BUTTON} onClick={() => onChoose("denied")}>
            Turn off
          </button>
        )}
        {status === "denied" && (
          <button type="button" className={BUTTON} onClick={() => onChoose("granted")}>
            Turn on
          </button>
        )}
        {onClose && (
          <button type="button" className={CLOSE_BUTTON} onClick={onClose}>
            Close
          </button>
        )}
        <Link href="/privacy" className={`ml-auto ${TEXT_LINK}`}>
          Privacy Policy
        </Link>
      </div>
    </section>
  );
}
