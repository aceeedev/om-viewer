import { FILM_GRAIN, type MonochromeProfile, type Recipe } from "@/lib/recipe";
import { FilterWheel } from "./filter-wheel";
import { PanelRow } from "./panel-row";
import { ExposureCompSlider, SettingSlider, Slider } from "./slider";
import { SwatchRow, TONING } from "./swatch-row";
import { ToneCurvePanel } from "./tone-curve-panel";
import { WhiteBalanceAndSliders } from "./white-balance-panel";

/** Film grain steps, Off to High, as the slider's scale. */
const GRAIN_STEPS = [0, 1, 2, 3].map((id) => FILM_GRAIN[id]);

/**
 * Monochrome Profile Control: the color filter wheel, the tone curve, the white balance screen,
 * then the profile's sliders, film grain and toning.
 */
export function MonochromeProfilePanel({ profile, recipe }: { profile: MonochromeProfile; recipe: Recipe }) {
  const { shading, filmGrain, toning, sharpness, contrast } = profile;

  return (
    <PanelRow>
      <FilterWheel filter={profile.filter} level={profile.filterStrength} />
      <ToneCurvePanel tone={recipe.tone} />
      <WhiteBalanceAndSliders wb={recipe.whiteBalance}>
        <SettingSlider label="Shading Effect" setting={shading} />
        {filmGrain && (
          <Slider
            label="Film Grain"
            value={filmGrain.id}
            min={0}
            max={GRAIN_STEPS.length - 1}
            display={filmGrain.label}
            range={GRAIN_STEPS.join(", ")}
          />
        )}
        {toning && <SwatchRow label="Toning" choice={toning} swatches={TONING} />}
        <SettingSlider label="Sharpness" setting={sharpness} />
        <SettingSlider label="Contrast" setting={contrast} />
        <ExposureCompSlider ev={recipe.exposure.exposureCompensation} />
      </WhiteBalanceAndSliders>
    </PanelRow>
  );
}
