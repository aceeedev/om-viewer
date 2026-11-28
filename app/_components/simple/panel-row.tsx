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
 * A picture mode's panels side by side, with a footnote under them for each setting marked
 * unverified. Below 640px, where two full-size screens don't fit, they go two to a row, scaled
 * down to fit; from there up they're full size, as many to a row as fit. Below 480px, where the
 * screens are under three quarters of their size, their text is enlarged by a quarter so it stays
 * readable (`screen-text-*` in globals.css). Below 360px even that's too small, so they go one to
 * a row, full size again.
 */
export function PanelRow({ notes = [], children }: { notes?: UnverifiedNote[]; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div
        className={
          "grid grid-cols-1 items-start gap-6 min-[22.5rem]:grid-cols-2 min-[22.5rem]:gap-3 " +
          "sm:flex sm:flex-wrap sm:gap-6 min-[22.5rem]:max-[30rem]:[--screen-text-boost:1.25]"
        }
      >
        {children}
      </div>
      {notes.map((n) => (
        <p key={n.label} className="text-xs text-amber-700">
          * {n.label} is unverified: {n.why}
        </p>
      ))}
    </div>
  );
}
