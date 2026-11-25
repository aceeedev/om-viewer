import type { ReactNode } from "react";
import { SAMPLE_SOURCE_PAGE, type SamplePhoto } from "@/lib/sample-photos";

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

/**
 * "Try a sample", for visitors without an OM System photo at hand. Outlined, so the solid
 * "Choose a photo" stays the main action.
 */
export function TrySampleButton({ onTry, busy = false }: { onTry: () => void; busy?: boolean }) {
  return (
    <button
      type="button"
      onClick={onTry}
      disabled={busy}
      className={
        "rounded-md border-[1.5px] border-black px-5 py-2.5 text-sm font-bold transition-colors " +
        "hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-50 " +
        FOCUS_RING
      }
    >
      Try a sample
    </button>
  );
}

/** Credit for an open sample: its profile, the photographer who made it, and where it was found. */
export function SampleCredit({ photo }: { photo: SamplePhoto }) {
  return (
    <p className="text-sm text-zinc-600">
      Sample: <span className="font-medium text-black">“{photo.title}”</span> by{" "}
      <ExternalLink href={photo.artistUrl}>{photo.artist}</ExternalLink>, from{" "}
      <ExternalLink href={SAMPLE_SOURCE_PAGE.url}>{SAMPLE_SOURCE_PAGE.title}</ExternalLink>.
    </p>
  );
}

/** Where the samples come from, shown under the "Try a sample" button. */
export function SampleSourceNote() {
  return (
    <p className="text-xs text-zinc-500">
      A random Creative Profile by an OM SYSTEM Ambassador photographer, from{" "}
      <ExternalLink href={SAMPLE_SOURCE_PAGE.url}>{SAMPLE_SOURCE_PAGE.title}</ExternalLink>.
    </p>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "rounded-sm text-inherit underline decoration-zinc-400 underline-offset-2 transition-colors " +
        "hover:text-black hover:decoration-black " +
        FOCUS_RING
      }
    >
      {children}
    </a>
  );
}
