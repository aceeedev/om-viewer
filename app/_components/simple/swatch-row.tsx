import { MONOCHROME_COLORS, type Choice } from "@/lib/recipe";
import { FILTERS } from "./filter-wheel";
import { SCREEN_RING, SCREEN_RING_OFFSET, SettingRow } from "./slider";

export interface Swatch {
  id: number;
  name: string;
  color: string;
}

/** Toning (Monochrome Color) in the camera's order, with a swatch of each tint. */
export const TONING: readonly Swatch[] = [
  { id: 1, color: "#9e9e9e" },
  { id: 2, color: "#a97c50" },
  { id: 3, color: "#5d7fb0" },
  { id: 4, color: "#8f6fae" },
  { id: 5, color: "#6f9b6f" },
].map((t) => ({ ...t, name: MONOCHROME_COLORS[t.id] }));

const filterColor = (name: string) => FILTERS.find((f) => f.name === name)?.color ?? "#9e9e9e";

/**
 * The Monochrome picture mode's color filters, named as in the manual ("None" is ExifTool's
 * "Neutral"), in the same colors as the Monochrome Profile's filter wheel.
 */
export const MONOTONE_FILTERS: readonly Swatch[] = [
  { id: 1, name: "None", color: "#9e9e9e" },
  ...["Yellow", "Orange", "Red", "Green"].map((name, i) => ({ id: i + 2, name, color: filterColor(name) })),
];

/**
 * A choice on the settings screen: its name and the option in use, then a swatch per option, the
 * one in use ringed and the rest dimmed. An ID the swatches don't know prints its stored label,
 * with nothing ringed.
 */
export function SwatchRow({ label, choice, swatches }: { label: string; choice: Choice; swatches: readonly Swatch[] }) {
  const selected = swatches.find((s) => s.id === choice.id);
  return (
    <SettingRow label={label} value={selected?.name ?? choice.label} choices={swatches.map((s) => s.name).join(", ")}>
      <div aria-hidden="true" className="mx-1 flex h-3 items-center justify-between">
        {swatches.map((s) => (
          <span
            key={s.id}
            title={s.name}
            className={`size-3 rounded-full ${s.id === choice.id ? `${SCREEN_RING} ring-white ${SCREEN_RING_OFFSET} ring-offset-screen` : "opacity-55"}`}
            style={{ backgroundColor: s.color }}
          />
        ))}
      </div>
    </SettingRow>
  );
}

/** A setting with no scale to draw, e.g. Art Filter "Grainy Film II": just its name and value. */
export function TextRow({ label, value }: { label: string; value: string }) {
  return <SettingRow label={label} value={value} />;
}
