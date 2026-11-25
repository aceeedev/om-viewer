import type { ReactNode } from "react";

/** A setting whose meaning hasn't been confirmed: its label carries an asterisk, explained here. */
export interface UnverifiedNote {
  label: string;
  why: string;
}

/** The asterisk after an unverified setting's label, on a dark screen. */
export function UnverifiedMark() {
  return <span className="text-amber-400">*</span>;
}

/**
 * A picture mode's panels side by side (they wrap on narrow screens), with a footnote under them
 * for each setting marked unverified.
 */
export function PanelRow({ notes = [], children }: { notes?: UnverifiedNote[]; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-6">{children}</div>
      {notes.map((n) => (
        <p key={n.label} className="text-xs text-amber-700 dark:text-amber-400">
          * {n.label} is unverified: {n.why}
        </p>
      ))}
    </div>
  );
}
