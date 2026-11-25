import { useId } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  /** Open a pasted image link. The field for it comes in the next step. */
  onUrl?: (url: string) => void;
  /** A file is being dragged over the page (drops are handled page-wide by the viewer). */
  dragging: boolean;
  busy?: boolean;
  /** Small one-line version shown under the preview once a photo is open. */
  compact?: boolean;
}

/**
 * File picker styled as a drop target, with a solid button like OM System's own pages but faintly
 * rounded corners. The whole box is the picker's label, so clicking anywhere in it opens the file dialog.
 */
export function DropZone({ onFile, dragging, busy = false, compact = false }: DropZoneProps) {
  const inputId = useId();

  const focus = "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-black";
  const className = compact
    ? // An outlined button: black on white, inverted on hover or while a file is dragged over the page.
      `flex cursor-pointer flex-col items-center gap-0.5 rounded-md border-[1.5px] border-black px-4 py-3 text-center transition-colors ${focus} ` +
      (dragging ? "bg-black text-white" : "hover:bg-black hover:text-white")
    : `group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-[1.5px] border-dashed px-6 py-14 text-center transition-colors ${focus} ` +
      (dragging ? "border-black bg-zinc-100" : "border-zinc-400 bg-white hover:border-black");

  return (
    <label htmlFor={inputId} className={className}>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,.jpg,.jpeg"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = ""; // allow picking the same file again
        }}
      />
      {compact ? (
        <>
          <span className="text-sm font-bold">Open another photo</span>
          <span className="text-xs opacity-70">or drop one anywhere on the page</span>
        </>
      ) : busy ? (
        <span className="text-xl font-extrabold font-stretch-expanded">Reading…</span>
      ) : (
        <>
          <span className="text-xl font-extrabold font-stretch-expanded">Drop an OM System JPEG here</span>
          <span className="text-sm text-zinc-500">or</span>
          <span className="rounded-md bg-black px-6 py-3 text-sm font-bold text-white transition-colors group-hover:bg-zinc-800">
            Choose a photo
          </span>
        </>
      )}
    </label>
  );
}
