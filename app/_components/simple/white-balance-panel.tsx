import type { ReactNode } from "react";
import type { WhiteBalance, WhiteBalanceFineTune } from "@/lib/recipe";
import * as fmt from "../format";
import { HUE_SWATCHES, whiteBalanceMode } from "../sections";
import { PanelColumn, SCREEN } from "./panel-column";
import { SettingsScreen } from "./slider";
import { BOX_CENTER, WB_SCREEN, cursorPosition } from "./white-balance-grid";

/** Each edge of the box in its direction's color, from the hue palette. */
const AXIS = { green: HUE_SWATCHES.Green, amber: HUE_SWATCHES.Orange, magenta: HUE_SWATCHES.Magenta, blue: HUE_SWATCHES.Blue };
const BOX_FILL = "#16161a";

/**
 * White balance as the camera shows it: the mode and the fine-tune ("A2.M2") across the top, the
 * mode's details below them, then the fine-tune box. Without a recorded fine-tune, just the mode.
 */
function WhiteBalanceScreen({ wb }: { wb: WhiteBalance }) {
  const mode = whiteBalanceMode(wb);
  const ft = wb.fineTune;
  if (!mode && !ft) return null;

  return (
    <PanelColumn>
      <div className={`text-white ${SCREEN}`}>
        <h3 className="sr-only">White balance</h3>
        {/* Two lines tall either way, so the screen stays square. The lines keep their height when
            the text is enlarged on a phone (see PanelRow). */}
        <div className={`flex flex-col px-5 pt-3.5 leading-[calc(1.5/var(--screen-text-boost,1))] ${ft ? "h-15" : "pb-3.5"}`}>
          <p className="flex items-baseline justify-between gap-3 screen-text-15 font-semibold tabular-nums">
            {mode && (
              <span>
                {mode.name}
                {mode.details.length > 0 && <span className="sr-only"> ({mode.details.join(", ")})</span>}
              </span>
            )}
            {ft && (
              <span className="screen-text-17" title={`Fine-tune: ${fmt.fineTuneWords(ft.amber.value, ft.green.value)}`}>
                <span aria-hidden="true">{fmt.fineTune(ft.amber.value, ft.green.value)}</span>
                <span className="sr-only">
                  fine-tune {fmt.fineTuneWords(ft.amber.value, ft.green.value)} (
                  {fmt.rangeText(ft.amber.min, ft.amber.max)} each)
                </span>
              </span>
            )}
          </p>
          {mode && mode.details.length > 0 && (
            <p aria-hidden="true" className="screen-text-13 text-white/60">
              {mode.details.join(" · ")}
            </p>
          )}
        </div>
        {ft && <FineTuneBox fineTune={ft} />}
      </div>
    </PanelColumn>
  );
}

/**
 * The fine-tune box: lettered tabs around it (G above, B left, A right, M below), each edge a solid
 * band of its direction's color, and a "+" cursor where the shift lands, with crosshair lines
 * through it. As on the camera, the tabs toward the shift are white and the others greyed out.
 */
function FineTuneBox({ fineTune }: { fineTune: WhiteBalanceFineTune }) {
  const { width, height, box, tab } = WB_SCREEN;
  const [x, y] = cursorPosition(fineTune);
  const [cx, cy] = BOX_CENTER;
  const x0 = box.x;
  const y0 = box.y;
  const x1 = box.x + box.size;
  const y1 = box.y + box.size;
  const e = box.edge;
  const amber = fineTune.amber.value;
  const green = fineTune.green.value;

  const tabs = [
    { letter: "G", lit: green > 0, x: cx - tab.long / 2, y: y0 - tab.gap - tab.short, w: tab.long, h: tab.short },
    { letter: "M", lit: green < 0, x: cx - tab.long / 2, y: y1 + tab.gap, w: tab.long, h: tab.short },
    { letter: "B", lit: amber < 0, x: x0 - tab.gap - tab.side.short, y: cy - tab.side.long / 2, w: tab.side.short, h: tab.side.long },
    { letter: "A", lit: amber > 0, x: x1 + tab.gap, y: cy - tab.side.long / 2, w: tab.side.short, h: tab.side.long },
  ];
  // Each edge as a trapezoid, so the corners meet cleanly.
  const edges = [
    { name: "top", color: AXIS.green, points: [[x0, y0], [x1, y0], [x1 - e, y0 + e], [x0 + e, y0 + e]] },
    { name: "right", color: AXIS.amber, points: [[x1, y0], [x1, y1], [x1 - e, y1 - e], [x1 - e, y0 + e]] },
    { name: "bottom", color: AXIS.magenta, points: [[x1, y1], [x0, y1], [x0 + e, y1 - e], [x1 - e, y1 - e]] },
    { name: "left", color: AXIS.blue, points: [[x0, y1], [x0, y0], [x0 + e, y0 + e], [x0 + e, y1 - e]] },
  ];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block w-full">
      {tabs.map((t) => (
        <g key={t.letter}>
          <rect
            x={t.x + 0.75}
            y={t.y + 0.75}
            width={t.w - 1.5}
            height={t.h - 1.5}
            rx={5}
            fill="none"
            stroke="white"
            strokeOpacity={t.lit ? 1 : 0.3}
            strokeWidth={1.5}
          />
          <text
            x={t.x + t.w / 2}
            y={t.y + t.h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            className="screen-svg-text-15"
            fontWeight={600}
            fill="white"
            fillOpacity={t.lit ? 1 : 0.4}
          >
            {t.letter}
          </text>
        </g>
      ))}
      <rect x={x0} y={y0} width={box.size} height={box.size} fill={BOX_FILL} />
      {/* Faint center lines mark no shift. */}
      <g stroke="white" strokeOpacity={0.08} strokeWidth={2}>
        <line x1={cx} y1={y0 + e} x2={cx} y2={y1 - e} />
        <line x1={x0 + e} y1={cy} x2={x1 - e} y2={cy} />
      </g>
      <g stroke="white" strokeOpacity={0.5} strokeWidth={2}>
        <line x1={x} y1={y0 + e} x2={x} y2={y1 - e} />
        <line x1={x0 + e} y1={y} x2={x1 - e} y2={y} />
      </g>
      {edges.map((edge) => (
        <polygon key={edge.name} points={edge.points.map((p) => p.join(",")).join(" ")} fill={edge.color} />
      ))}
      <g stroke="white" strokeWidth={2} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 2px rgb(0 0 0 / 0.6))" }}>
        <line x1={x - 7} y1={y} x2={x + 7} y2={y} />
        <line x1={x} y1={y - 7} x2={x} y2={y + 7} />
        <circle cx={x} cy={y} r={3} fill="white" stroke="none" />
      </g>
    </svg>
  );
}

/**
 * The white balance screen, then the mode's other settings on a screen of their own next to it
 * (on the next row when that one's full). Without settings it's white balance on its own.
 */
export function WhiteBalanceAndSliders({ wb, children }: { wb: WhiteBalance; children?: ReactNode }) {
  return (
    <>
      <WhiteBalanceScreen wb={wb} />
      {children && <SettingsScreen>{children}</SettingsScreen>}
    </>
  );
}
