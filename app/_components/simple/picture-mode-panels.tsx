/**
 * Panels for the picture modes without a wheel of their own: the standard modes (i-Enhance,
 * Vivid, Natural, Muted, Portrait, e-Portrait, Underwater), Monochrome, Art, and modes this app
 * doesn't recognize. Each is the tone curve (except Art), the white balance screen, then the mode's
 * settings as slider rows.
 */
import {
  GRADATIONS,
  PICTURE_MODE_EFFECTS,
  type ArtProfile,
  type Gradation,
  type LabeledRange,
  type MonotoneProfile,
  type Recipe,
  type StandardProfile,
} from "@/lib/recipe";
import { PanelRow, type UnverifiedNote } from "./panel-row";
import { ExposureCompSlider, SettingSlider } from "./slider";
import { MONOTONE_FILTERS, SwatchRow, TextRow, TONING } from "./swatch-row";
import { ToneCurvePanel } from "./tone-curve-panel";
import { WhiteBalanceAndSliders } from "./white-balance-panel";

const AUTO_OVERRIDE =
  'the camera flagged it "Auto-Override" (as ExifTool names it); what that changes hasn\'t been confirmed.';

/** Gradation, marked unverified when the camera flagged it as auto-overridden. */
function gradationSetting(gradation: Gradation | undefined): LabeledRange | undefined {
  if (gradation?.selection !== "Auto-Override") return gradation;
  return { ...gradation, unverified: AUTO_OVERRIDE };
}

function gradationNotes(gradation: Gradation | undefined): UnverifiedNote[] {
  const g = gradationSetting(gradation);
  return g?.unverified ? [{ label: "Gradation", why: g.unverified }] : [];
}

/**
 * A setting with a name for each step, e.g. Gradation Low Key / Normal / High Key, as a slider
 * that prints the step's name. The names come from the label table, which is keyed by
 * "value min max".
 */
function NamedStepSlider({
  label,
  setting,
  names,
}: {
  label: string;
  setting: LabeledRange | undefined;
  names: Record<string, string>;
}) {
  if (!setting) return null;
  const steps: string[] = [];
  for (let v = setting.min; v <= setting.max; v++) steps.push(names[`${v} ${setting.min} ${setting.max}`] ?? String(v));
  return <SettingSlider label={label} setting={setting} display={setting.label} range={steps.join(", ")} />;
}

/** i-Enhance, Vivid, Natural, Muted, Portrait, e-Portrait and Underwater. */
export function StandardPanel({ profile, recipe }: { profile: StandardProfile; recipe: Recipe }) {
  return (
    <PanelRow notes={gradationNotes(profile.gradation)}>
      <ToneCurvePanel tone={recipe.tone} />
      <WhiteBalanceAndSliders wb={recipe.whiteBalance}>
        <NamedStepSlider label="Effect" setting={profile.effect} names={PICTURE_MODE_EFFECTS} />
        <SettingSlider label="Saturation" setting={profile.saturation} />
        <SettingSlider label="Sharpness" setting={profile.sharpness} />
        <SettingSlider label="Contrast" setting={profile.contrast} />
        <NamedStepSlider label="Gradation" setting={gradationSetting(profile.gradation)} names={GRADATIONS} />
        <ExposureCompSlider ev={recipe.exposure.exposureCompensation} />
      </WhiteBalanceAndSliders>
    </PanelRow>
  );
}

/** The Monochrome picture mode (ExifTool's "Monotone") and the older Sepia mode. */
export function MonotonePanel({ profile, recipe }: { profile: MonotoneProfile; recipe: Recipe }) {
  // ID 0 is ExifTool's "n/a": the shot didn't record that setting.
  const { bwFilter, pictureTone } = profile;
  return (
    <PanelRow notes={gradationNotes(profile.gradation)}>
      <ToneCurvePanel tone={recipe.tone} />
      <WhiteBalanceAndSliders wb={recipe.whiteBalance}>
        {bwFilter && bwFilter.id !== 0 && <SwatchRow label="Color Filter" choice={bwFilter} swatches={MONOTONE_FILTERS} />}
        {pictureTone && pictureTone.id !== 0 && <SwatchRow label="Toning" choice={pictureTone} swatches={TONING} />}
        <SettingSlider label="Sharpness" setting={profile.sharpness} />
        <SettingSlider label="Contrast" setting={profile.contrast} />
        <NamedStepSlider label="Gradation" setting={gradationSetting(profile.gradation)} names={GRADATIONS} />
        <ExposureCompSlider ev={recipe.exposure.exposureCompensation} />
      </WhiteBalanceAndSliders>
    </PanelRow>
  );
}

/** Art filters: Highlight & Shadow doesn't apply, so there's no tone curve. */
export function ArtPanel({ profile, recipe }: { profile: ArtProfile; recipe: Recipe }) {
  const { filter, effect } = profile;
  return (
    <PanelRow>
      <WhiteBalanceAndSliders wb={recipe.whiteBalance}>
        {filter && <TextRow label="Art Filter" value={filter.label} />}
        {/* The camera shows no effect as "Off". */}
        {effect && <TextRow label="Effect" value={effect.id === 0 ? "Off" : effect.label} />}
        <ExposureCompSlider ev={recipe.exposure.exposureCompensation} />
      </WhiteBalanceAndSliders>
    </PanelRow>
  );
}

/** A picture mode this app doesn't know: what applies to every mode, and where to look for more. */
export function UnknownModePanel({ recipe }: { recipe: Recipe }) {
  const { mode } = recipe.profile;
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-zinc-600">
        This picture mode isn&apos;t recognized yet{mode.id >= 0 ? ` (ID ${mode.id})` : ""}. Switch to Full
        details to see every value the camera recorded.
      </p>
      <PanelRow>
        <WhiteBalanceAndSliders wb={recipe.whiteBalance}>
          <ExposureCompSlider ev={recipe.exposure.exposureCompensation} />
        </WhiteBalanceAndSliders>
      </PanelRow>
    </div>
  );
}
