import type { ColorProfile, Recipe } from "@/lib/recipe";
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
  return (
    <PanelRow>
      <PanelColumn>
        <HueWheel hues={profile.hues} />
      </PanelColumn>
      <ToneCurvePanel tone={recipe.tone} />
      <WhiteBalanceAndSliders wb={recipe.whiteBalance}>
        <SettingSlider label="Shading Effect" setting={profile.shading} />
        <SettingSlider label="Sharpness" setting={profile.sharpness} />
        <SettingSlider label="Contrast" setting={profile.contrast} />
        <ExposureCompSlider ev={recipe.exposure.exposureCompensation} />
      </WhiteBalanceAndSliders>
    </PanelRow>
  );
}
