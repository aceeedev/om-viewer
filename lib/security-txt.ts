import { SECURITY_POLICY_URL, SECURITY_REPORT_URL, SITE_URL } from "./site";

/** Where security.txt lives (RFC 9116), served by app/.well-known/security.txt/route.ts. */
export const SECURITY_TXT_PATH = "/.well-known/security.txt";

/**
 * How far ahead `Expires` is set. RFC 9116 recommends under a year. The route rebuilds the file about
 * once a week, so the date keeps moving forward, and a missed rebuild still leaves months to spare.
 */
export const SECURITY_TXT_EXPIRES_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The security.txt file as of `now`: where to report a security problem, and the policy for it. */
export function securityTxt(now: Date): string {
  const expires = new Date(now.getTime() + SECURITY_TXT_EXPIRES_DAYS * DAY_MS);
  const fields = [
    ["Contact", SECURITY_REPORT_URL],
    // RFC 3339 date and time, to the second.
    ["Expires", expires.toISOString().replace(/\.\d{3}Z$/, "Z")],
    ["Policy", SECURITY_POLICY_URL],
    ["Preferred-Languages", "en"],
    ["Canonical", new URL(SECURITY_TXT_PATH, SITE_URL).href],
  ];
  return fields.map(([name, value]) => `${name}: ${value}\n`).join("");
}
