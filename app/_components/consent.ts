import { useSyncExternalStore } from "react";

/** What a visitor answered when asked about analytics. */
export type ConsentChoice = "granted" | "denied";

/**
 * Where analytics stands for this visitor right now:
 * - `unknown`: on the server, and while the page hydrates. Nothing is shown, so the HTML is the same
 *   for everyone and the page stays static.
 * - `gpc`: the browser sends Global Privacy Control. Analytics stays off and the visitor isn't asked,
 *   whatever they chose before.
 * - `undecided`: no answer yet, so the banner asks.
 * - `granted` or `denied`: their answer.
 */
export type ConsentStatus = "unknown" | "gpc" | "undecided" | ConsentChoice;

export interface ConsentSnapshot {
  status: ConsentStatus;
  /** The visitor opened the cookie settings from the footer to see or change their answer. */
  settingsOpen: boolean;
}

/** The local storage key that keeps the answer between visits. Never sent to the server. */
export const CONSENT_STORAGE_KEY = "analytics-consent";

/** The parts of the browser the store uses, passed in so tests can fake them. */
export interface ConsentEnv {
  /** Local storage. May throw, as browsers do when a visitor blocks storage for the site. */
  storage(): Pick<Storage, "getItem" | "setItem">;
  /** Whether the browser sends Global Privacy Control. */
  globalPrivacyControl(): boolean;
  /**
   * Calls `onChange` with the key whenever another tab changes local storage (`null` when it's
   * cleared). Returns a function that stops listening.
   */
  watchStorage(onChange: (key: string | null) => void): () => void;
}

/** Holds the answer and tells React when it changes, for `useSyncExternalStore`. */
export interface ConsentStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): ConsentSnapshot;
  getServerSnapshot(): ConsentSnapshot;
  /** Saves the visitor's answer and closes the settings. */
  choose(choice: ConsentChoice): void;
  /** Opens the settings again, from the footer link. */
  openSettings(): void;
}

const SERVER_SNAPSHOT: ConsentSnapshot = { status: "unknown", settingsOpen: false };

function parseChoice(value: string | null): ConsentChoice | null {
  return value === "granted" || value === "denied" ? value : null;
}

export function createConsentStore(env: ConsentEnv): ConsentStore {
  const listeners = new Set<() => void>();
  let stopWatching: (() => void) | null = null;
  // The answer given in this tab. It wins over what storage holds, so an answer still counts for this
  // visit when storage is blocked or the write fails. Most of all, declining after accepting must
  // never fall back to the "granted" still in storage.
  let answeredHere: ConsentChoice | null = null;
  let settingsOpen = false;
  // useSyncExternalStore needs the same object back until something changes.
  let snapshot = SERVER_SNAPSHOT;

  function readStored(): ConsentChoice | null {
    try {
      return parseChoice(env.storage().getItem(CONSENT_STORAGE_KEY));
    } catch {
      return null; // storage is blocked
    }
  }

  function readStatus(): ConsentStatus {
    if (env.globalPrivacyControl()) return "gpc";
    return answeredHere ?? readStored() ?? "undecided";
  }

  function notify() {
    for (const listener of listeners) listener();
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      stopWatching ??= env.watchStorage((key) => {
        if (key !== CONSENT_STORAGE_KEY && key !== null) return;
        // Another tab answered (or the site's data was cleared) after this one, so its answer is newer.
        answeredHere = null;
        notify();
      });
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          stopWatching?.();
          stopWatching = null;
        }
      };
    },

    getSnapshot() {
      const status = readStatus();
      if (status !== snapshot.status || settingsOpen !== snapshot.settingsOpen) {
        snapshot = { status, settingsOpen };
      }
      return snapshot;
    },

    getServerSnapshot: () => SERVER_SNAPSHOT,

    choose(choice) {
      answeredHere = choice;
      try {
        env.storage().setItem(CONSENT_STORAGE_KEY, choice);
      } catch {
        // Storage is blocked or full. The answer still holds until the page is closed.
      }
      settingsOpen = false;
      notify();
    },

    openSettings() {
      settingsOpen = true;
      notify();
    },
  };
}

/** The real browser. Only touched once the page runs in one, never while the module loads. */
const browserEnv: ConsentEnv = {
  storage: () => window.localStorage,
  // Not in TypeScript's Navigator type yet. Only `true` counts: the property is missing where it's off.
  globalPrivacyControl: () => (navigator as { globalPrivacyControl?: unknown }).globalPrivacyControl === true,
  watchStorage(onChange) {
    const onStorage = (event: StorageEvent) => onChange(event.key);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  },
};

/** The page's one store, shared by the banner, the footer link and the analytics loader. */
export const consentStore = createConsentStore(browserEnv);

/** The visitor's analytics answer, kept up to date. `unknown` on the server and while hydrating. */
export function useConsent(): ConsentSnapshot {
  return useSyncExternalStore(consentStore.subscribe, consentStore.getSnapshot, consentStore.getServerSnapshot);
}
