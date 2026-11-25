import { useId } from "react";
import type { Choice, Ranged } from "@/lib/recipe";
import { HUE_SWATCHES } from "../sections";
import { labelCenter } from "./filter-labels";
import { PanelColumn, SCREEN } from "./panel-column";
import { WHEEL, hueAngle, outlineSide, points, polar } from "./wheel-geometry";

/** The face inside the octagon. */
const FACE = "#16161a";
/** Opacity of the sides, and of the names, of the filters not in use. */
const DIMMED = 0.35;
const DIMMED_LABEL = 0.45;

/**
 * The eight color filters, in the camera's order (IDs 1–8) and clockwise from the top like the
 * hue wheel. Each takes the color of the Color Profile hue it's named for (the manual names the
 * filters but shows no colors). `width` is the name's width in the page font
 * (Geist) at 15px, measured in Firefox, so each name can be placed clear of the octagon.
 */
export const FILTERS = [
  { name: "Yellow", color: HUE_SWATCHES.Yellow, width: 46.2 },
  { name: "Orange", color: HUE_SWATCHES.Orange, width: 50.1 },
  { name: "Red", color: HUE_SWATCHES.Red, width: 27.1 },
  { name: "Magenta", color: HUE_SWATCHES.Magenta, width: 60.3 },
  { name: "Blue", color: HUE_SWATCHES.Blue, width: 30.8 },
  { name: "Cyan", color: HUE_SWATCHES.Cyan, width: 35 },
  { name: "Green", color: HUE_SWATCHES.Green, width: 40.8 },
  { name: "Yellow-green", color: HUE_SWATCHES["Yellow-green"], width: 91.6 },
] as const;

/** Turn the octagon half a side, so each filter's side is centered on its direction. */
const ROTATION = -180 / FILTERS.length;

/**
 * How far the pointer reaches at the top level. Levels are evenly spaced out from the center,
 * and the top one stays clear of the octagon's sides (their inner edge is ~80 units out).
 */
const REACH = 66;

/** How far the level readout sits from the screen's top and right edges. */
const READOUT_INSET = 14;

/**
 * Monochrome Profile color filter as an eight-sided wheel on a camera-style screen: the filter in
 * use is the bright side and its name the bright one, its wedge of the face glows in its color,
 * and a pointer runs toward it, out to its level (1–3) on the rings. The level is printed in the
 * top right corner. With no filter, every side is dimmed, there's no pointer, and the corner says
 * so.
 */
export function FilterWheel({ filter, level }: { filter: Choice | undefined; level: Ranged | undefined }) {
  const id = useId().replace(/[^\w-]/g, "");
  if (!filter) return null;

  const count = FILTERS.length;
  const index = filter.id - 1;
  const selected = FILTERS[index] as (typeof FILTERS)[number] | undefined;
  // "No Filter" for ID 0; an ID this app doesn't know prints its stored label.
  const name = selected?.name ?? filter.label;
  const angle = (i: number) => hueAngle(i, count);
  const corner = (radius: number, i: number) => polar(radius, angle(i) + ROTATION);
  /** An octagon whose sides' middles are `radius` from the center, where the pointer lands. */
  const octagon = (radius: number) => points(FILTERS.map((_, i) => corner(radius / Math.cos(Math.PI / count), i)));
  const radius = (value: number) => (level && level.max > 0 ? (Math.min(Math.max(value, 0), level.max) / level.max) * REACH : 0);
  // The pointer: toward the filter in use, out to its level.
  const pointer =
    selected && level
      ? { tip: polar(radius(level.value), angle(index)), color: selected.color, title: `${selected.name} filter, level ${level.value}` }
      : undefined;
  const rings = level ? ringLevels(level).map(radius) : [];
  const readout = !selected ? name : level ? `Level ${level.value}` : undefined;
  const c = WHEEL.size / 2;
  // Where the band's inner edge is, straight out from the center along a filter's direction.
  const inner = (WHEEL.outline - WHEEL.outlineWidth / 2) * Math.cos(Math.PI / count);

  return (
    <PanelColumn>
      <h3 className="sr-only">Color filter</h3>
      <p className="sr-only">
        {name}
        {selected && level && `, level ${level.value} (${level.min} to ${level.max})`}
      </p>
      <svg viewBox={`0 0 ${WHEEL.size} ${WHEEL.size}`} aria-hidden="true" className={`block w-full tabular-nums ${SCREEN}`}>
        {selected && (
          <defs>
            <radialGradient id={`${id}-glow`} cx={c} cy={c} r={WHEEL.outline} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={selected.color} stopOpacity={0} />
              <stop offset="1" stopColor={selected.color} stopOpacity={0.4} />
            </radialGradient>
          </defs>
        )}
        {readout && (
          <text
            x={WHEEL.size - READOUT_INSET}
            y={READOUT_INSET + 10}
            textAnchor="end"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={600}
            fill="white"
            fillOpacity={selected ? 1 : DIMMED_LABEL}
          >
            {readout}
          </text>
        )}
        <g transform={`translate(${c} ${c})`}>
          <polygon points={points(FILTERS.map((_, i) => corner(WHEEL.outline, i)))} fill={FACE} />
          {selected && (
            <polygon
              points={points([[0, 0], corner(WHEEL.outline, index), corner(WHEEL.outline, index + 1)])}
              fill={`url(#${id}-glow)`}
            />
          )}
          {/* The grid: a spoke toward each filter and a ring per level. */}
          <g stroke="white" strokeWidth={1} fill="none">
            {FILTERS.map((f, i) => {
              const [x, y] = polar(inner, angle(i));
              return <line key={f.name} x1={0} y1={0} x2={x} y2={y} strokeOpacity={0.1} />;
            })}
            {rings.map((r) => (
              <polygon key={r} points={octagon(r)} strokeOpacity={0.28} />
            ))}
          </g>
          {FILTERS.map((f, i) => (
            <polygon
              key={f.name}
              points={outlineSide(i, count, ROTATION)}
              fill={f.color}
              fillOpacity={i === index ? 1 : DIMMED}
            />
          ))}
          {pointer && (
            <line x1={0} y1={0} x2={pointer.tip[0]} y2={pointer.tip[1]} stroke="white" strokeWidth={2} strokeLinecap="round" />
          )}
          <circle r={3} fill="white" />
          {pointer && (
            <circle
              cx={pointer.tip[0]}
              cy={pointer.tip[1]}
              r={WHEEL.dot}
              fill={pointer.color}
              stroke="white"
              strokeOpacity={0.85}
              strokeWidth={1.25}
              style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.5))" }}
            >
              <title>{pointer.title}</title>
            </circle>
          )}
          {FILTERS.map((f, i) => {
            const [x, y] = labelCenter(i, f.width);
            return (
              <text
                key={f.name}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={15}
                fill="white"
                fillOpacity={i === index ? 1 : DIMMED_LABEL}
              >
                {f.name}
              </text>
            );
          })}
        </g>
      </svg>
    </PanelColumn>
  );
}

/** One ring per level a filter can be set to (1 and up; 0 is the center). */
function ringLevels({ min, max }: Ranged): number[] {
  const levels: number[] = [];
  for (let v = Math.max(min, 1); v <= max; v++) levels.push(v);
  return levels;
}
