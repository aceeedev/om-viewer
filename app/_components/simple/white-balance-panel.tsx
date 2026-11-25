import { useId, type ReactNode } from "react";
import type { WhiteBalance, WhiteBalanceFineTune } from "@/lib/recipe";
import * as fmt from "../format";
import { HUE_SWATCHES, whiteBalanceMode } from "../sections";
import { PanelColumn, SCREEN } from "./panel-column";
import { SettingsScreen } from "./slider";
import { BOX_CENTER, WB_SCREEN, cursorPosition } from "./white-balance-grid";

/** Each direction's color, from the hue palette; the box's corners blend the two beside them. */
const AXIS = { green: HUE_SWATCHES.Green, amber: HUE_SWATCHES.Orange, magenta: HUE_SWATCHES.Magenta, blue: HUE_SWATCHES.Blue };
const CORNER = {
  topLeft: HUE_SWATCHES.Cyan,
  topRight: HUE_SWATCHES.Yellow,
  bottomRight: HUE_SWATCHES.Red,
  bottomLeft: HUE_SWATCHES.Violet,
};
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
        {/* Two lines tall either way, so the screen stays square. */}
        <div className={`flex flex-col px-5 pt-3.5 ${ft ? "h-15" : "pb-3.5"}`}>
          <p className="flex items-baseline justify-between gap-3 text-[15px] font-semibold tabular-nums">
            {mode && (
              <span>
                {mode.name}
                {mode.details.length > 0 && <span className="sr-only"> ({mode.details.join(", ")})</span>}
              </span>
            )}
            {ft && (
              <span className="text-[17px]" title={`Fine-tune: ${fmt.fineTuneWords(ft.amber.value, ft.green.value)}`}>
                <span aria-hidden="true">{fmt.fineTune(ft.amber.value, ft.green.value)}</span>
                <span className="sr-only">
                  fine-tune {fmt.fineTuneWords(ft.amber.value, ft.green.value)} (
                  {fmt.rangeText(ft.amber.min, ft.amber.max)} each)
                </span>
              </span>
            )}
          </p>
          {mode && mode.details.length > 0 && (
            <p aria-hidden="true" className="text-[13px] text-white/60">
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
 * The fine-tune box: lettered tabs around it (G above, B left, A right, M below), its edges
 * running around the color wheel, and a "+" cursor where the shift lands, with crosshair lines
 * through it. The tabs toward the shift light up.
 */
function FineTuneBox({ fineTune }: { fineTune: WhiteBalanceFineTune }) {
  const id = useId().replace(/[^\w-]/g, "");
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
    { letter: "G", color: AXIS.green, lit: green > 0, x: cx - tab.long / 2, y: y0 - tab.gap - tab.short, w: tab.long, h: tab.short },
    { letter: "M", color: AXIS.magenta, lit: green < 0, x: cx - tab.long / 2, y: y1 + tab.gap, w: tab.long, h: tab.short },
    { letter: "B", color: AXIS.blue, lit: amber < 0, x: x0 - tab.gap - tab.side.short, y: cy - tab.side.long / 2, w: tab.side.short, h: tab.side.long },
    { letter: "A", color: AXIS.amber, lit: amber > 0, x: x1 + tab.gap, y: cy - tab.side.long / 2, w: tab.side.short, h: tab.side.long },
  ];
  // Each edge as a trapezoid (so the corners meet cleanly), shaded from corner to corner through
  // its direction's color.
  const edges = [
    { name: "top", points: [[x0, y0], [x1, y0], [x1 - e, y0 + e], [x0 + e, y0 + e]], from: [x0, y0], to: [x1, y0], stops: [CORNER.topLeft, AXIS.green, CORNER.topRight] },
    { name: "right", points: [[x1, y0], [x1, y1], [x1 - e, y1 - e], [x1 - e, y0 + e]], from: [x1, y0], to: [x1, y1], stops: [CORNER.topRight, AXIS.amber, CORNER.bottomRight] },
    { name: "bottom", points: [[x1, y1], [x0, y1], [x0 + e, y1 - e], [x1 - e, y1 - e]], from: [x0, y1], to: [x1, y1], stops: [CORNER.bottomLeft, AXIS.magenta, CORNER.bottomRight] },
    { name: "left", points: [[x0, y1], [x0, y0], [x0 + e, y0 + e], [x0 + e, y1 - e]], from: [x0, y0], to: [x0, y1], stops: [CORNER.topLeft, AXIS.blue, CORNER.bottomLeft] },
  ];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block w-full">
      <defs>
        {edges.map((edge) => (
          <linearGradient
            key={edge.name}
            id={`${id}-edge-${edge.name}`}
            gradientUnits="userSpaceOnUse"
            x1={edge.from[0]}
            y1={edge.from[1]}
            x2={edge.to[0]}
            y2={edge.to[1]}
          >
            {edge.stops.map((color, i) => (
              <stop key={i} offset={i / 2} stopColor={color} />
            ))}
          </linearGradient>
        ))}
      </defs>
      {tabs.map((t) => (
        <g key={t.letter}>
          <rect
            x={t.x + 0.75}
            y={t.y + 0.75}
            width={t.w - 1.5}
            height={t.h - 1.5}
            rx={5}
            fill={t.lit ? t.color : "none"}
            fillOpacity={0.14}
            stroke={t.lit ? t.color : "white"}
            strokeOpacity={t.lit ? 1 : 0.22}
            strokeWidth={1.5}
          />
          <text
            x={t.x + t.w / 2}
            y={t.y + t.h / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={600}
            fill="white"
            fillOpacity={t.lit ? 1 : 0.5}
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
        <polygon key={edge.name} points={edge.points.map((p) => p.join(",")).join(" ")} fill={`url(#${id}-edge-${edge.name})`} />
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
 * The white balance screen, then the mode's other settings on a screen of their own beside it
 * (below it on narrow screens). Without settings it's white balance on its own.
 */
export function WhiteBalanceAndSliders({ wb, children }: { wb: WhiteBalance; children?: ReactNode }) {
  return (
    <>
      <WhiteBalanceScreen wb={wb} />
      {children && <SettingsScreen>{children}</SettingsScreen>}
    </>
  );
}
