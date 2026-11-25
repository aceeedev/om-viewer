import type { ColorCreatorProfile, Ranged, Recipe } from "@/lib/recipe";
import * as fmt from "../format";
import { HUE_STEPS_UNVERIFIED, PALETTE, hueStepColor } from "./color-creator";
import { PanelColumn, SCREEN } from "./panel-column";
import { PanelRow, UnverifiedMark } from "./panel-row";
import { ExposureCompSlider, SettingSlider } from "./slider";
import { ToneCurvePanel } from "./tone-curve-panel";
import { WhiteBalanceAndSliders } from "./white-balance-panel";
import { CENTER_GRAY, colorWheelFill } from "./wheel-fill";
import { WHEEL, hueAngle, levelRadius, outlineSide, points, polar } from "./wheel-geometry";

/**
 * Color Creator: the hue ring, the tone curve, the white balance screen, then the mode's sliders.
 */
export function ColorCreatorPanel({ profile, recipe }: { profile: ColorCreatorProfile; recipe: Recipe }) {
  const hue = steps(profile.color) ? profile.color : undefined;
  return (
    <PanelRow notes={hue ? [{ label: "Hue", why: HUE_STEPS_UNVERIFIED }] : []}>
      {hue && <ColorCreatorWheel hue={hue} saturation={profile.strength} />}
      <ToneCurvePanel tone={recipe.tone} />
      <WhiteBalanceAndSliders wb={recipe.whiteBalance}>
        <SettingSlider label="Sharpness" setting={profile.sharpness} />
        <SettingSlider label="Contrast" setting={profile.contrast} />
        <ExposureCompSlider ev={recipe.exposure.exposureCompensation} />
      </WhiteBalanceAndSliders>
    </PanelRow>
  );
}

/** How many hue steps the ring has (30 on OM bodies); 0 if the range can't be a ring. */
function steps(hue: Ranged | undefined): number {
  return hue && hue.max - hue.min >= 2 ? hue.max - hue.min + 1 : 0;
}

/** The ring's center, a little below the screen's middle to leave room for the values above. */
const CENTER: [x: number, y: number] = [WHEEL.size / 2, 152];
/** Where the values sit: the middle of their line, and how far in from the screen's sides. */
const VALUES_Y = 27;
const VALUES_INSET = 20;

/**
 * The hue as a ring of steps on a camera-style screen, clockwise from the top like the other
 * wheels, with "Hue 12" and "Saturation +2" across the top. The face is the color wheel, dimmed
 * except for the wedge toward the hue in use; a pointer runs that way, out to the saturation: on
 * the inner ring at the minimum, the middle ring at 0, just inside the outline at the maximum (as
 * the hue wheel places its values).
 */
function ColorCreatorWheel({ hue, saturation }: { hue: Ranged; saturation: Ranged | undefined }) {
  const count = steps(hue);
  const step = Math.min(Math.max(hue.value, hue.min), hue.max) - hue.min;
  /** Turn the ring half a step, so each step's side is centered on its direction. */
  const rotation = -180 / count;
  const corner = (radius: number, i: number) => polar(radius, hueAngle(i, count) + rotation);
  const ring = (radius: number) => points(Array.from({ length: count }, (_, i) => corner(radius, i)));
  const outline = ring(WHEEL.outline);
  const wedge = points([[0, 0], corner(WHEEL.outline, step), corner(WHEEL.outline, step + 1)]);
  const tip = polar(
    saturation ? levelRadius(saturation.value, saturation.min, saturation.max) : WHEEL.minRadius,
    hueAngle(step, count),
  );
  const color = hueStepColor(step, count);
  const fill = colorWheelFill(PALETTE, Array.from({ length: count }, (_, i) => corner(WHEEL.outline, i)), CENTER);

  return (
    <PanelColumn>
      <h3 className="sr-only">Color Creator</h3>
      <ul className="sr-only">
        <li>
          Hue
          <UnverifiedMark /> {hue.value} ({fmt.rangeText(hue.min, hue.max)})
        </li>
        {saturation && (
          <li>
            Saturation {fmt.signed(saturation.value)} ({fmt.rangeText(saturation.min, saturation.max)})
          </li>
        )}
      </ul>
      {/* The color wheel's face lies under the SVG, which draws everything else over it. */}
      <div className={`relative ${SCREEN}`}>
        <div aria-hidden="true" style={fill} />
        <svg
          viewBox={`0 0 ${WHEEL.size} ${WHEEL.size}`}
          aria-hidden="true"
          className="relative block w-full tabular-nums"
        >
          <g fontSize={17} fontWeight={600} fill="white">
            <text x={VALUES_INSET} y={VALUES_Y} dominantBaseline="central">
              Hue<tspan className="fill-amber-400">*</tspan> {hue.value}
            </text>
            {saturation && (
              <text x={WHEEL.size - VALUES_INSET} y={VALUES_Y} textAnchor="end" dominantBaseline="central">
                Saturation {fmt.level(saturation.value)}
              </text>
            )}
          </g>
          <g transform={`translate(${CENTER[0]} ${CENTER[1]})`}>
            {/* Dim the wheel, except the wedge toward the hue in use. */}
            <path d={`M${outline}Z M${wedge}Z`} fill="black" fillOpacity={0.5} fillRule="evenodd" />
            {saturation && (
              <g stroke="white" strokeWidth={1} fill="none" strokeOpacity={0.5}>
                <polygon points={ring(WHEEL.minRadius)} fill={`rgb(${CENTER_GRAY})`} fillOpacity={0.35} />
                <polygon points={ring(levelRadius(0, saturation.min, saturation.max))} />
              </g>
            )}
            {Array.from({ length: count }, (_, i) => (
              <polygon key={i} points={outlineSide(i, count, rotation)} fill={hueStepColor(i, count)} />
            ))}
            <line x1={0} y1={0} x2={tip[0]} y2={tip[1]} stroke="white" strokeWidth={2} strokeLinecap="round" />
            <circle r={3} fill="white" />
            <circle
              cx={tip[0]}
              cy={tip[1]}
              r={WHEEL.dot}
              fill={color}
              stroke="white"
              strokeOpacity={0.85}
              strokeWidth={1.25}
              style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.5))" }}
            >
              <title>{`Hue ${hue.value}${saturation ? `, saturation ${fmt.signed(saturation.value)}` : ""}`}</title>
            </circle>
          </g>
        </svg>
      </div>
    </PanelColumn>
  );
}
