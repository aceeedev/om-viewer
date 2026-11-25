import { useId } from "react";
import type { HueSaturation } from "@/lib/recipe";
import * as fmt from "../format";
import { HUE_SWATCHES } from "../sections";
import { SCREEN } from "./panel-column";
import { CENTER_GRAY, colorWheelFill } from "./wheel-fill";
import { WHEEL, hueAngle, levelRadius, outlineSide, points, polar } from "./wheel-geometry";

/**
 * Color Profile Control as the camera draws it: a 12-sided color wheel, Yellow at the top and
 * the hues clockwise in the camera's order. Each hue's dot sits at its saturation, from the
 * inner ring (the minimum) through the middle ring (0) to the outline (the maximum); the shape
 * they make is lit, the rest of the wheel dimmed. Each value is printed outside, signed.
 */
export function HueWheel({ hues }: { hues: HueSaturation[] }) {
  const id = useId().replace(/[^\w-]/g, "");
  if (hues.length === 0) return null;

  const count = hues.length;
  const { min, max } = hues[0];
  const at = (radius: number, i: number) => polar(radius, hueAngle(i, count));
  const ring = (radius: number) => points(hues.map((_, i) => at(radius, i)));
  const colors = hues.map((h) => HUE_SWATCHES[h.hue]);
  const dots = hues.map((h, i) => at(levelRadius(h.value, h.min, h.max), i));
  const shape = points(dots);
  const outline = ring(WHEEL.outline);
  const c = WHEEL.size / 2;

  // The color wheel: each hue at its corner, blending into the next, fading to gray toward the
  // middle, clipped to the outline.
  const fill = colorWheelFill(colors, hues.map((_, i) => at(WHEEL.outline, i)));
  const box = WHEEL.outline;

  return (
    <div>
      <svg
        viewBox={`0 0 ${WHEEL.size} ${WHEEL.size}`}
        aria-hidden="true"
        className={`block w-full tabular-nums ${SCREEN}`}
      >
        <defs>
          {/* One gradient per side of the outline, from its hue to the next. */}
          {hues.map((_, i) => {
            const [x1, y1] = at(WHEEL.outline, i);
            const [x2, y2] = at(WHEEL.outline, i + 1);
            return (
              <linearGradient key={i} id={`${id}-side-${i}`} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
                <stop offset="0" stopColor={colors[i]} />
                <stop offset="1" stopColor={colors[(i + 1) % count]} />
              </linearGradient>
            );
          })}
        </defs>
        <g transform={`translate(${c} ${c})`}>
          <foreignObject x={-box} y={-box} width={2 * box} height={2 * box}>
            <div style={fill} />
          </foreignObject>
          {/* Dim the wheel outside the hues' shape and light it inside. */}
          <path d={`M${outline}Z M${shape}Z`} fill="black" fillOpacity={0.5} fillRule="evenodd" />
          <polygon points={shape} fill="white" fillOpacity={0.38} />
          {/* The grid: spokes, the minimum ring around the gray middle, and the ring at 0. */}
          <g stroke="white" strokeWidth={1} fill="none">
            {hues.map((h, i) => {
              const [x1, y1] = at(WHEEL.minRadius, i);
              const [x2, y2] = at(WHEEL.outline, i);
              return <line key={h.hue} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity={0.14} />;
            })}
            <polygon points={ring(WHEEL.minRadius)} fill={`rgb(${CENTER_GRAY})`} fillOpacity={0.35} strokeOpacity={0.5} />
            <polygon points={ring(levelRadius(0, min, max))} strokeOpacity={0.5} />
          </g>
          <polygon points={shape} fill="none" stroke="white" strokeWidth={2} strokeLinejoin="round" />
          {hues.map((h, i) => (
            <polygon key={h.hue} points={outlineSide(i, count)} fill={`url(#${id}-side-${i})`} />
          ))}
          <g style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.5))" }}>
            {hues.map((h, i) => (
              <circle
                key={h.hue}
                cx={dots[i][0]}
                cy={dots[i][1]}
                r={WHEEL.dot}
                fill={colors[i]}
                stroke="white"
                strokeOpacity={0.85}
                strokeWidth={1.25}
              >
                <title>{`${h.hue}: ${fmt.signed(h.value)}`}</title>
              </circle>
            ))}
          </g>
          {hues.map((h, i) => {
            const [x, y] = at(WHEEL.label, i);
            return (
              <text
                key={h.hue}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={17}
                fontWeight={600}
                fill="white"
              >
                {fmt.signed(h.value)}
              </text>
            );
          })}
        </g>
      </svg>
      <ul className="sr-only">
        {hues.map((h) => (
          <li key={h.hue}>
            {h.hue} {fmt.rangedValue(h.value, h.min)} ({fmt.rangeText(h.min, h.max)})
          </li>
        ))}
      </ul>
    </div>
  );
}
