"use client";

import { bannerShown, consentStore, useConsent } from "./consent";

/** The footer's Cookie settings link: opens the consent banner to see or change the answer. */
export function CookieSettingsButton({ className }: { className: string }) {
  const snapshot = useConsent();
  return (
    <button
      type="button"
      aria-expanded={bannerShown(snapshot)}
      onClick={consentStore.openSettings}
      className={className}
    >
      Cookie settings
    </button>
  );
}
