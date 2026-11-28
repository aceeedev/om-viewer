import { useId, useState } from "react";

interface DropZoneProps {
  onFile: (file: File) => void;
  /** Open a pasted image link. */
  onUrl: (url: string) => void;
  /** A file is being dragged over the page (drops are handled page-wide by the viewer). */
  dragging: boolean;
  busy?: boolean;
  /** Small version shown under the preview once a photo is open. */
  compact?: boolean;
  /** Link to show in the field when it first appears, e.g. one that just failed to open. */
  initialUrl?: string;
}

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black";

/** Wording about dropping a file, which phones can't do. Hidden there (see `phone` in globals.css). */
export const DROP_WORDING = "phone:hidden";
/** What phones show in its place. */
export const PHONE_WORDING = "hidden phone:inline";

/**
 * File picker styled as a drop target, with a solid button like OM System's own pages but faintly
 * rounded corners, and a field for pasting an image link under it. The file picker's part of the box
 * is its label, so clicking there opens the file dialog; the link field is kept outside that label so
 * clicking into it doesn't. Phones get the same box without the drop wording.
 */
export function DropZone({ onFile, onUrl, dragging, busy = false, compact = false, initialUrl }: DropZoneProps) {
  const fileId = useId();
  const fileInput = (
    <input
      id={fileId}
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
  );
  const linkForm = <LinkForm onUrl={onUrl} busy={busy} compact={compact} initialUrl={initialUrl} />;

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        {/* An outlined button: black on white, inverted on hover or while a file is dragged over the page. */}
        <label
          htmlFor={fileId}
          className={
            "flex cursor-pointer flex-col items-center gap-0.5 rounded-md border-[1.5px] border-black px-4 py-3 text-center transition-colors " +
            "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-black " +
            (dragging ? "bg-black text-white" : "hover:bg-black hover:text-white")
          }
        >
          {fileInput}
          <span className="text-sm font-bold">Open another photo</span>
          <span className={`text-xs opacity-70 ${DROP_WORDING}`}>or drop one anywhere on the page</span>
        </label>
        {linkForm}
      </div>
    );
  }

  return (
    <div
      className={
        "flex flex-col rounded-md border-[1.5px] border-dashed transition-colors " +
        (dragging ? "border-black bg-zinc-100" : "border-zinc-400 bg-white hover:border-black")
      }
    >
      <label
        htmlFor={fileId}
        className="group flex cursor-pointer flex-col items-center justify-center gap-3 px-6 pt-14 pb-8 text-center"
      >
        {fileInput}
        {busy ? (
          <span className="text-xl font-extrabold font-stretch-expanded">Reading…</span>
        ) : (
          <>
            <span className={`text-xl font-extrabold font-stretch-expanded ${DROP_WORDING}`}>
              Drop an OM System JPEG here
            </span>
            <span className={`text-xl font-extrabold font-stretch-expanded ${PHONE_WORDING}`}>Open an OM System JPEG</span>
            <span className={`text-sm text-zinc-500 ${DROP_WORDING}`}>or</span>
            {/* The file input is hidden, so its keyboard focus shows on this button instead. */}
            <span
              className={
                "rounded-md bg-black px-6 py-3 text-sm font-bold text-white transition-colors group-hover:bg-zinc-800 " +
                "group-has-[:focus-visible]:outline-2 group-has-[:focus-visible]:outline-offset-2 group-has-[:focus-visible]:outline-black"
              }
            >
              Choose a photo
            </span>
          </>
        )}
      </label>
      <div className="mx-auto w-full max-w-md px-6 pb-12">{linkForm}</div>
    </div>
  );
}

/** A text field and Open button for an image link. Enter in the field opens it too. */
function LinkForm({
  onUrl,
  busy,
  compact,
  initialUrl = "",
}: {
  onUrl: (url: string) => void;
  busy: boolean;
  compact: boolean;
  initialUrl?: string;
}) {
  const urlId = useId();
  const [url, setUrl] = useState(initialUrl);

  return (
    <form
      noValidate // our own messages explain a bad link better than the browser's tooltip
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const link = url.trim();
        if (link && !busy) onUrl(link);
      }}
    >
      <label htmlFor={urlId} className={compact ? "sr-only" : "text-center text-sm text-zinc-500"}>
        {compact ? "Image link" : "or paste a link to one"}
      </label>
      <div className="flex gap-2">
        <input
          id={urlId}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={compact ? "Or paste an image link" : "https://…/P1010042.JPG"}
          autoComplete="off"
          spellCheck={false}
          disabled={busy}
          className={
            "min-w-0 flex-1 rounded-md border-[1.5px] border-zinc-400 bg-white px-3 py-2.5 text-sm transition-colors " +
            "placeholder:text-zinc-400 hover:border-black focus:border-black disabled:opacity-50 " +
            FOCUS_RING
          }
        />
        <button
          type="submit"
          disabled={busy}
          className={
            "rounded-md bg-black px-5 text-sm font-bold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 " +
            FOCUS_RING
          }
        >
          Open
        </button>
      </div>
    </form>
  );
}
