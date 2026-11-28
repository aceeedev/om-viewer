export type FetchImageErrorCode =
  | "invalid-url"
  | "unsupported-protocol"
  | "insecure"
  | "blocked"
  | "http-error"
  | "web-page"
  | "not-jpeg"
  | "too-large"
  | "timeout"
  | "aborted";

export interface FetchImageError {
  code: FetchImageErrorCode;
  message: string;
  /** The message on phones, where it differs: they can't drop a file, so it says to open one. */
  phoneMessage?: string;
}

export type FetchImageResult = { ok: true; file: File } | { ok: false; error: FetchImageError };

/** Larger than any camera JPEG; stops a bad link from filling the tab's memory. */
export const MAX_IMAGE_BYTES = 64 * 1024 * 1024;

/** Give up when the host sends nothing (no reply, or no new data) for this long. */
export const STALL_TIMEOUT_MS = 30_000;

export interface FetchImageOptions {
  /** Stops the download, e.g. when another photo is opened. */
  signal?: AbortSignal;
  stallTimeoutMs?: number;
}

const FALLBACK_NAME = "photo.jpg";

/**
 * Download a pasted image link straight from the browser and hand it back as a File, ready for
 * `readPhotoMetadata`. Nothing goes through our server: this only works when the image's host allows
 * other sites to read it (CORS); otherwise the result says so and suggests downloading the photo instead.
 * Never throws; failures come back as `{ ok: false }`.
 */
export async function fetchImageFromUrl(
  input: string,
  { signal, stallTimeoutMs = STALL_TIMEOUT_MS }: FetchImageOptions = {},
): Promise<FetchImageResult> {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return failure("invalid-url");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return failure("unsupported-protocol");
  // An https page can't load http:// content (mixed content); the browser would only say "failed to fetch".
  if (url.protocol === "http:" && globalThis.location?.protocol === "https:") return failure("insecure");

  // The timer restarts whenever data arrives, so a slow but steady download still finishes,
  // while a host that stops answering fails instead of leaving "Reading…" up forever.
  const stall = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const progress = () => {
    clearTimeout(timer);
    timer = setTimeout(() => stall.abort(), stallTimeoutMs);
  };
  const abortSignal = signal ? AbortSignal.any([signal, stall.signal]) : stall.signal;

  try {
    progress();
    const response = await fetch(url, {
      signal: abortSignal,
      mode: "cors",
      credentials: "omit", // never send the visitor's cookies for that site
      referrerPolicy: "no-referrer", // and don't tell it which page asked
    });
    progress();
    if (!response.ok) return httpFailure(response.status);

    const mime = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (mime === "text/html" || mime === "application/xhtml+xml") return failure("web-page");
    // Other image types can't hold a recipe. Anything else (octet-stream, no type) is left to the parser.
    if (mime.startsWith("image/") && !JPEG_TYPES.has(mime)) return notJpeg(mime);

    const length = Number(response.headers.get("content-length"));
    if (length > MAX_IMAGE_BYTES) return failure("too-large");

    const bytes = await readCapped(response, MAX_IMAGE_BYTES, abortSignal, progress);
    if (!bytes) return failure("too-large");
    return { ok: true, file: new File(bytes, fileNameFrom(url), { type: "image/jpeg" }) };
  } catch {
    if (signal?.aborted) return failure("aborted");
    if (stall.signal.aborted) return failure("timeout");
    // fetch() rejects with a bare TypeError for CORS refusals, network errors and offline hosts alike.
    return failure("blocked");
  } finally {
    clearTimeout(timer);
  }
}

const JPEG_TYPES = new Set(["image/jpeg", "image/jpg", "image/pjpeg"]);

/**
 * The body's chunks, or null as soon as it passes `max` bytes (the size header can be missing or wrong).
 * Throws if `signal` aborts partway, so a cut-off download is never mistaken for a whole one.
 */
async function readCapped(
  response: Response,
  max: number,
  signal: AbortSignal,
  onChunk: () => void,
): Promise<Uint8Array<ArrayBuffer>[] | null> {
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  if (!response.body) return chunks;
  const reader = response.body.getReader();
  const stop = () => void reader.cancel().catch(() => {});
  signal.addEventListener("abort", stop, { once: true });
  try {
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      signal.throwIfAborted();
      if (done) return chunks;
      onChunk();
      total += value.byteLength;
      if (total > max) {
        stop();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener("abort", stop);
  }
}

/** The last part of the link's path, e.g. "P1010042.JPG" for ".../photos/P1010042.JPG?dl=1". */
export function fileNameFrom(url: URL): string {
  const last = url.pathname.split("/").findLast((part) => part !== "");
  if (!last) return FALLBACK_NAME;
  try {
    return decodeURIComponent(last);
  } catch {
    return last; // a stray "%" that isn't an escape
  }
}

function failure(code: FetchImageErrorCode): { ok: false; error: FetchImageError } {
  return { ok: false, error: { code, message: MESSAGES[code], phoneMessage: PHONE_MESSAGES[code] } };
}

function httpFailure(status: number): { ok: false; error: FetchImageError } {
  const message =
    status === 404 || status === 410
      ? `Nothing was found at that link (error ${status}).`
      : status === 401 || status === 403
        ? `That site won't share this image (error ${status}). It may be private or only open when signed in.`
        : `The site couldn't send that image (error ${status}).`;
  return { ok: false, error: { code: "http-error", message } };
}

function notJpeg(mime: string): { ok: false; error: FetchImageError } {
  const format = mime.slice("image/".length).split("+")[0].toUpperCase(); // "image/svg+xml" → "SVG"
  return {
    ok: false,
    error: {
      code: "not-jpeg",
      message: `That link is a ${format} image, not a JPEG. Picture settings are only saved in the camera's JPEGs.`,
    },
  };
}

const MESSAGES: Record<FetchImageErrorCode, string> = {
  "invalid-url": "That doesn't look like a link. Paste the full address, starting with https://.",
  "unsupported-protocol": "Only http:// and https:// links can be opened.",
  insecure: "This page is secure (https), so the browser won't load http:// links. Try the https:// version.",
  blocked:
    "Couldn't load that link. The site may not let other pages read its images, or it may be offline. " +
    "Download the photo and drop it here instead.",
  "http-error": "The site couldn't send that image.",
  "web-page": "That link opens a web page, not the image itself. Open the photo, then copy the image's own address.",
  "not-jpeg": "That link isn't a JPEG.",
  "too-large": `That image is over ${MAX_IMAGE_BYTES / 1024 / 1024} MB, too big to open here.`,
  timeout: "That site stopped responding. Try again, or download the photo and drop it here instead.",
  aborted: "Stopped loading that link.",
};

/** The messages that say to drop the photo, as phones get them. */
const PHONE_MESSAGES: Partial<Record<FetchImageErrorCode, string>> = {
  blocked:
    "Couldn't load that link. The site may not let other pages read its images, or it may be offline. " +
    "Download the photo and open it here instead.",
  timeout: "That site stopped responding. Try again, or download the photo and open it here instead.",
};
