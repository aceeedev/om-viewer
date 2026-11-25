import type { ColorProfile, Ranged, Recipe } from "@/lib/recipe";
import { HueWheel } from "./hue-wheel";
import { PanelColumn } from "./panel-column";
import { PanelRow } from "./panel-row";
import { ExposureCompSlider, SettingSlider } from "./slider";
import { ToneCurvePanel } from "./tone-curve-panel";
import { WhiteBalanceAndSliders } from "./white-balance-panel";

/**
 * Color Profile Control: the hue wheel, the tone curve, the white balance screen, then the
 * profile's sliders.
 */
export function ColorProfilePanel({ profile, recipe }: { profile: ColorProfile; recipe: Recipe }) {
  const ranged: [label: string, setting: Ranged | undefined][] = [
    ["Shading Effect", profile.shading],
    ["Sharpness", profile.sharpness],
    ["Contrast", profile.contrast],
  ];
  const notes = ranged.flatMap(([label, s]) => (s?.unverified ? [{ label, why: s.unverified }] : []));

  return (
    <PanelRow notes={notes}>
      <PanelColumn>
        <HueWheel hues={profile.hues} />
      </PanelColumn>
      <ToneCurvePanel tone={recipe.tone} />
      <WhiteBalanceAndSliders wb={recipe.whiteBalance}>
        {ranged.map(([label, s]) => (
          <SettingSlider key={label} label={label} setting={s} />
        ))}
        <ExposureCompSlider ev={recipe.exposure.exposureCompensation} />
      </WhiteBalanceAndSliders>
    </PanelRow>
  );
}
