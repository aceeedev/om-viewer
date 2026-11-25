import { useId } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  /** A file is being dragged over the page (drops are handled page-wide by the viewer). */
  dragging: boolean;
  busy?: boolean;
  /** Small one-line version shown under the preview once a photo is open. */
  compact?: boolean;
}

/** File picker styled as a drop target. */
export function DropZone({ onFile, dragging, busy = false, compact = false }: DropZoneProps) {
  const inputId = useId();

  const base =
    "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-center " +
    "transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-500";
  const tone = dragging
    ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900"
    : "border-zinc-300 hover:border-zinc-500 dark:border-zinc-700 dark:hover:border-zinc-500";
  const size = compact ? "px-4 py-3 text-sm" : "px-6 py-16";

  return (
    <label htmlFor={inputId} className={`${base} ${tone} ${size}`}>
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
        <span>
          Drop another photo or <span className="underline">choose a file</span>
        </span>
      ) : (
        <>
          <span className="text-lg font-medium">{busy ? "Reading…" : "Drop an OM System JPEG here"}</span>
          {!busy && <span className="text-sm text-zinc-500 dark:text-zinc-400">or click to choose a file</span>}
        </>
      )}
    </label>
  );
}
