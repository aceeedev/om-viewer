import type { ReactNode } from "react";

/** The black focus outline used by the site's buttons and links. */
export const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

/** An underlined link inside running text. */
export const TEXT_LINK =
  "rounded-sm text-inherit underline decoration-zinc-400 underline-offset-2 transition-colors " +
  "hover:text-black hover:decoration-black " +
  FOCUS_RING;

/** A link to another site, opened in a new tab. */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={TEXT_LINK}>
      {children}
    </a>
  );
}
