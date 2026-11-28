import type { ReactNode } from "react";
import type { Ranged } from "@/lib/recipe";
import * as fmt from "../format";
import { PanelColumn, SCREEN } from "./panel-column";
import { UnverifiedMark } from "./panel-row";

/** The most ticks a scale draws; a longer range gets one tick every few steps. */
const MAX_TICKS = 21;

/**
 * The settings screen: the picture mode's other settings, one row each, like a camera's settings
 * list. At least as tall as the screens beside it, with the rows centered. If every row turns out
 * empty (nothing recorded), the whole column is hidden rather than left as a blank screen.
 */
export function SettingsScreen({ children }: { children: ReactNode }) {
  return (
    <PanelColumn className="not-has-[>div>div]:hidden">
      <div className={`flex min-h-70 flex-col justify-center gap-1.5 px-5 py-2.5 text-white ${SCREEN}`}>
        <h3 className="sr-only">Settings</h3>
        {children}
      </div>
    </PanelColumn>
  );
}

/**
 * One row of the settings screen: the setting's name on the left and its value on the right, as
 * on the camera, with what's under them (a scale, swatches) below. `choices` is for screen
 * readers: the range, or every option.
 */
export function SettingRow({
  label,
  mark,
  value,
  choices,
  children,
}: {
  label: string;
  /** Shown right after the label, e.g. an "unverified" asterisk. */
  mark?: ReactNode;
  value: string;
  choices?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-baseline justify-between gap-3 leading-5">
        <span className="screen-text-14 text-white/65">
          {label}
          {mark}
        </span>
        <span className="text-right screen-text-15 font-semibold tabular-nums">
          {value}
          {choices && <span className="sr-only"> ({choices})</span>}
        </span>
      </p>
      {children}
    </div>
  );
}

/**
 * A read-only scale, like the camera's: a tick per step, the run from 0 (or the low end, for a
 * range that starts at 0) out to the value lit, and a bright marker at the value. Ticks and marker
 * are placed by percentage, so the marker always lands on its tick.
 */
function Scale({ value, min, max }: { value: number; min: number; max: number }) {
  const at = (v: number) =>
    max <= min ? 50 : Math.round(((Math.min(max, Math.max(min, v)) - min) / (max - min)) * 10000) / 100;
  const origin = min < 0 && max > 0 ? 0 : min;
  const every = Math.ceil((max - min) / (MAX_TICKS - 1)) || 1;
  const ticks: number[] = [];
  for (let v = min; v <= max; v += every) ticks.push(v);
  const [from, to] = [at(origin), at(value)].sort((a, b) => a - b);

  return (
    <div aria-hidden="true" className="relative mx-1 h-3">
      <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-white/15" />
      <div className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-white/75" style={{ left: `${from}%`, width: `${Math.round((to - from) * 100) / 100}%` }} />
      {ticks.map((v) => (
        <span
          key={v}
          className={`absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 ${v === origin && min < 0 ? "h-2.5 bg-white/60" : "h-1.5 bg-white/35"}`}
          style={{ left: `${at(v)}%` }}
        />
      ))}
      <span
        className="absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white ring-2 ring-screen"
        style={{ left: `${at(value)}%` }}
      />
    </div>
  );
}

/**
 * A setting on a scale: its name and value, then the scale. A range through 0 prints the value
 * signed as the camera does ("+1", "±0", "−2"); a range from 0 up prints it plain.
 */
export function Slider({
  label,
  value,
  min,
  max,
  display = min < 0 ? fmt.level(value) : fmt.plain(value),
  range = fmt.rangeText(min, max),
  mark,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  /** The value as printed. */
  display?: string;
  /** The choices, for screen readers; defaults to "min to max". */
  range?: string;
  mark?: ReactNode;
}) {
  return (
    <SettingRow label={label} mark={mark} value={display} choices={range}>
      <Scale value={value} min={min} max={max} />
    </SettingRow>
  );
}

/**
 * A recorded setting as a slider row, nothing if it wasn't recorded. A setting with no range
 * (stored as "0 0 0", ExifTool's "n/a") is left out too. Unverified settings get an asterisk.
 */
export function SettingSlider({
  label,
  setting,
  display,
  range,
}: {
  label: string;
  setting: Ranged | undefined;
  display?: string;
  range?: string;
}) {
  if (!setting || setting.max <= setting.min) return null;
  return (
    <Slider
      label={label}
      value={setting.value}
      min={setting.min}
      max={setting.max}
      display={display}
      range={range}
      mark={setting.unverified ? <UnverifiedMark /> : undefined}
    />
  );
}

/** OM System bodies offer ±5 EV of exposure compensation. */
const EXPOSURE_COMP = { min: -5, max: 5 };

/** Exposure compensation as a slider row ("−0.7"); nothing if the photo has none. */
export function ExposureCompSlider({ ev }: { ev: number | undefined }) {
  if (ev === undefined) return null;
  return <Slider label="Exposure Comp" value={ev} {...EXPOSURE_COMP} display={fmt.evLevel(ev)} />;
}
