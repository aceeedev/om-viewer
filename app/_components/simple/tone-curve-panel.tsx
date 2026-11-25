import type { Ranged, ToneLevels } from "@/lib/recipe";
import * as fmt from "../format";
import { PanelColumn, SCREEN } from "./panel-column";
import { TONE, midtoneCurve, shadowHighlightCurve } from "./tone-curve";

const PLOT_FILL = "#1b1b1f";
const FRAME = "#5c5c63";
const GRID = "#35353b";
const CURVE = "#ececec";

/**
 * Highlight & Shadow control as the camera shows it: "Sh −4  Mid ±0  Hi +4" across the top of the
 * screen, above a plot of the midtone arch and the shadow/highlight curve. Dark tones are on the
 * left, bright on the right. Renders nothing if no level is recorded.
 */
export function ToneCurvePanel({ tone }: { tone: ToneLevels }) {
  const { shadows, midtones, highlights } = tone;
  if (!shadows && !midtones && !highlights) return null;

  const { left, top, size } = TONE.plot;
  const right = left + size;
  const bottom = top + size;
  const levels: [short: string, name: string, level: Ranged | undefined, x: number, anchor: "start" | "middle" | "end"][] = [
    ["Sh", "Shadows", shadows, left, "start"],
    ["Mid", "Midtones", midtones, TONE.size / 2, "middle"],
    ["Hi", "Highlights", highlights, right, "end"],
  ];

  return (
    <PanelColumn>
      <h3 className="sr-only">Highlight &amp; Shadow</h3>
      <svg viewBox={`0 0 ${TONE.size} ${TONE.size}`} aria-hidden="true" className={`block w-full tabular-nums ${SCREEN}`}>
        {levels.map(
          ([short, name, level, x, anchor]) =>
            level && (
              <text
                key={short}
                x={x}
                y={TONE.labelY}
                textAnchor={anchor}
                dominantBaseline="central"
                fontSize={17}
                fontWeight={600}
                fill="white"
              >
                {`${short} ${fmt.level(level.value)}`}
                <title>{`${name}: ${fmt.level(level.value)}`}</title>
              </text>
            ),
        )}
        <rect x={left} y={top} width={size} height={size} rx={2} fill={PLOT_FILL} />
        <g stroke={GRID} strokeWidth={1.5}>
          <line x1={TONE.size / 2} y1={top} x2={TONE.size / 2} y2={bottom} />
          <line x1={left} y1={top + size / 2} x2={right} y2={top + size / 2} />
        </g>
        <g fill="none" stroke={CURVE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {midtones && <path d={midtoneCurve(midtones.value)} />}
          {(shadows || highlights) && <path d={shadowHighlightCurve(shadows?.value ?? 0, highlights?.value ?? 0)} />}
        </g>
        <rect x={left} y={top} width={size} height={size} rx={2} fill="none" stroke={FRAME} strokeWidth={1.5} />
      </svg>
      <ul className="sr-only">
        {levels.map(
          ([short, name, level]) =>
            level && (
              <li key={short}>
                {name} {fmt.signed(level.value)} ({fmt.rangeText(level.min, level.max)})
              </li>
            ),
        )}
      </ul>
    </PanelColumn>
  );
}
