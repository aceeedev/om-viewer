import { SAMPLE_SOURCE_PAGE, type SamplePhoto } from "@/lib/sample-photos";
import { ExternalLink, FOCUS_RING } from "./text-link";

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
