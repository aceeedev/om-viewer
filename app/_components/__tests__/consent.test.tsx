import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CONSENT_STORAGE_KEY, createConsentStore, useConsent, type ConsentEnv } from "../consent";

interface FakeOptions {
  /** What local storage already holds under the consent key. */
  stored?: string;
  gpc?: boolean;
  /** Reading and writing storage throws, as when a visitor blocks it. */
  blocked?: boolean;
  /** Only writing throws, as when storage is full. */
  readOnly?: boolean;
}

/** A store on a fake browser, with a way to act as another tab. */
function fakeBrowser({ stored, gpc = false, blocked = false, readOnly = false }: FakeOptions = {}) {
  const items = new Map<string, string>();
  if (stored !== undefined) items.set(CONSENT_STORAGE_KEY, stored);
  const watchers = new Set<(key: string | null) => void>();
  const env: ConsentEnv = {
    storage() {
      if (blocked) throw new DOMException("The operation is insecure.", "SecurityError");
      return {
        getItem: (key) => items.get(key) ?? null,
        setItem(key, value) {
          if (readOnly) throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
          items.set(key, value);
        },
      };
    },
    globalPrivacyControl: () => gpc,
    watchStorage(onChange) {
      watchers.add(onChange);
      return () => watchers.delete(onChange);
    },
  };
  return {
    store: createConsentStore(env),
    items,
    watchers,
    /** Another tab sets `key` (or clears all storage, with `null`). */
    otherTab(key: string | null, value?: string) {
      if (key === null) items.clear();
      else if (value !== undefined) items.set(key, value);
      for (const onChange of watchers) onChange(key);
    },
  };
}

describe("consent store", () => {
  it("is unknown on the server, so every visitor gets the same HTML", () => {
    const { store } = fakeBrowser({ stored: "granted" });
    expect(store.getServerSnapshot()).toEqual({ status: "unknown", settingsOpen: false });
  });

  it("is undecided until the visitor answers", () => {
    expect(fakeBrowser().store.getSnapshot()).toEqual({ status: "undecided", settingsOpen: false });
  });

  it("remembers an answer from an earlier visit", () => {
    expect(fakeBrowser({ stored: "granted" }).store.getSnapshot().status).toBe("granted");
    expect(fakeBrowser({ stored: "denied" }).store.getSnapshot().status).toBe("denied");
  });

  it("asks again when storage holds something it doesn't know", () => {
    for (const stored of ["", "yes", "true", "Granted"]) {
      expect(fakeBrowser({ stored }).store.getSnapshot().status).toBe("undecided");
    }
  });

  it("keeps analytics off under Global Privacy Control, even after an earlier yes", () => {
    expect(fakeBrowser({ gpc: true }).store.getSnapshot().status).toBe("gpc");
    const { store } = fakeBrowser({ gpc: true, stored: "granted" });
    expect(store.getSnapshot().status).toBe("gpc");
    store.choose("granted");
    expect(store.getSnapshot().status).toBe("gpc");
  });

  it("saves an answer, closes the settings and tells subscribers", () => {
    const { store, items } = fakeBrowser();
    const listener = vi.fn();
    store.subscribe(listener);
    store.openSettings();
    store.choose("granted");
    expect(items.get(CONSENT_STORAGE_KEY)).toBe("granted");
    expect(store.getSnapshot()).toEqual({ status: "granted", settingsOpen: false });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("opens the settings without changing the answer", () => {
    const { store } = fakeBrowser({ stored: "denied" });
    store.openSettings();
    expect(store.getSnapshot()).toEqual({ status: "denied", settingsOpen: true });
  });

  it("returns the same snapshot until something changes", () => {
    const { store } = fakeBrowser();
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);
    store.choose("denied");
    const second = store.getSnapshot();
    expect(second).not.toBe(first);
    expect(store.getSnapshot()).toBe(second);
  });

  it("keeps an answer for this visit when storage is blocked", () => {
    const { store } = fakeBrowser({ blocked: true });
    expect(store.getSnapshot().status).toBe("undecided");
    store.choose("denied");
    expect(store.getSnapshot().status).toBe("denied");
  });

  it("turns analytics off when the visitor declines, even if saving the no fails", () => {
    const { store, items } = fakeBrowser({ stored: "granted", readOnly: true });
    store.choose("denied");
    expect(items.get(CONSENT_STORAGE_KEY)).toBe("granted");
    expect(store.getSnapshot().status).toBe("denied");
  });

  it("follows an answer given in another tab", () => {
    const { store, otherTab } = fakeBrowser();
    const listener = vi.fn();
    store.subscribe(listener);
    store.choose("granted");
    listener.mockClear();
    otherTab(CONSENT_STORAGE_KEY, "denied");
    expect(listener).toHaveBeenCalledOnce();
    expect(store.getSnapshot().status).toBe("denied");
  });

  it("asks again when another tab clears the site's storage", () => {
    const { store, otherTab } = fakeBrowser({ stored: "granted" });
    store.subscribe(() => {});
    otherTab(null);
    expect(store.getSnapshot().status).toBe("undecided");
  });

  it("ignores other tabs changing other storage keys", () => {
    const { store, otherTab } = fakeBrowser();
    const listener = vi.fn();
    store.subscribe(listener);
    store.choose("granted");
    listener.mockClear();
    otherTab("something-else", "1");
    expect(listener).not.toHaveBeenCalled();
    expect(store.getSnapshot().status).toBe("granted");
  });

  it("watches other tabs once, and stops when the last subscriber leaves", () => {
    const { store, watchers } = fakeBrowser();
    const unsubscribeA = store.subscribe(() => {});
    const unsubscribeB = store.subscribe(() => {});
    expect(watchers.size).toBe(1);
    unsubscribeA();
    expect(watchers.size).toBe(1);
    unsubscribeB();
    expect(watchers.size).toBe(0);
    store.subscribe(() => {});
    expect(watchers.size).toBe(1);
  });
});

describe("useConsent", () => {
  it("renders as unknown on the server without touching the browser", () => {
    function Probe() {
      const { status, settingsOpen } = useConsent();
      return `${status} ${settingsOpen}`;
    }
    expect(renderToStaticMarkup(<Probe />)).toBe("unknown false");
  });
});
