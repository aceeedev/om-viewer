import type { ReactNode } from "react";

/** The camera-style screen behind a panel: near-black, with rounded corners. */
export const SCREEN = "rounded-xl bg-screen";

/** One column of the Simple view's panel row: a 280px screen, narrower on a small phone. */
export function PanelColumn({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`flex w-full max-w-70 shrink-0 flex-col ${className}`}>{children}</div>;
}
