"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useConsent } from "./consent";
import { gtagScriptUrl, startAnalytics, stopAnalytics } from "./gtag";

/**
 * Google Analytics, only once the visitor accepts it. Until then nothing from Google loads, and
 * declining later stops it and deletes its cookies. Under Global Privacy Control it never loads.
 *
 * It sends page views and GA's enhanced measurement events, such as clicks on links to other sites.
 * Those carry the page's URL and title and the links' addresses, so none of them may ever hold anything
 * from a photo (its metadata has serial numbers) or a pasted link.
 */
export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const { status } = useConsent();

  useEffect(() => {
    if (status === "unknown") return; // not hydrated yet
    if (status === "granted") startAnalytics(window, measurementId);
    else stopAnalytics(window, document, measurementId);
  }, [status, measurementId]);

  return status === "granted" ? <Script src={gtagScriptUrl(measurementId)} /> : null;
}
