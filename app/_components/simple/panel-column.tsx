import type { ReactNode } from "react";

/**
 * The camera-style screen behind a panel: near-black, with rounded corners. Everything on it
 * scales with its column (see `screen-scale` in globals.css).
 */
export const SCREEN = "rounded-xl bg-screen screen-scale";

/**
 * One column of the Simple view's panel row: a 280px screen, or half the row on a phone. It's the
 * container its screen scales against.
 */
export function PanelColumn({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`@container flex w-full max-w-70 shrink-0 flex-col ${className}`}>{children}</div>;
}
