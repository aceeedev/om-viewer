import type { ColorProfileHue } from "./tags";

/** A setting the camera stores together with its allowed range. */
export interface Ranged {
  value: number;
  min: number;
  max: number;
  /** Set when where this value is stored hasn't been confirmed; explains the assumption. */
  unverified?: string;
}

/** An enumerated setting: the stored ID and its label. */
export interface Choice {
  id: number;
  label: string;
}

/** A ranged setting whose value also has a name, e.g. i-Enhance effect "Standard". */
export interface LabeledRange extends Ranged {
  label: string;
}

export interface Gradation extends LabeledRange {
  /** "User-Selected" or "Auto-Override", when stored. */
  selection?: string;
}

export interface PictureMode extends Choice {
  /** Slot number for numbered modes, e.g. 2 for "Color Profile 2". */
  slot?: number;
}

export interface HueSaturation extends Ranged {
  hue: ColorProfileHue;
}

/** Highlight & Shadow control (plus midtones on newer bodies). */
export interface ToneLevels {
  highlights?: Ranged;
  shadows?: Ranged;
  midtones?: Ranged;
}

interface ProfileBase {
  mode: PictureMode;
  contrast?: Ranged;
  sharpness?: Ranged;
}

export interface ColorProfile extends ProfileBase {
  kind: "colorProfile";
  /** Saturation of each of the 12 hues, in the camera's order. */
  hues: HueSaturation[];
  shading?: Ranged;
}

export interface MonochromeProfile extends ProfileBase {
  kind: "monochromeProfile";
  filter?: Choice;
  filterStrength?: Ranged;
  filmGrain?: Choice;
  shading?: Ranged;
  toning?: Choice;
}

export interface ColorCreatorProfile extends ProfileBase {
  kind: "colorCreator";
  /** Hue step around the color wheel. */
  color?: Ranged;
  strength?: Ranged;
}

/** Vivid, Natural, Muted, Portrait, i-Enhance, e-Portrait, Underwater. */
export interface StandardProfile extends ProfileBase {
  kind: "standard";
  saturation?: Ranged;
  gradation?: Gradation;
  /** i-Enhance only. */
  effect?: LabeledRange;
}

/** Monotone and Sepia picture modes. */
export interface MonotoneProfile extends ProfileBase {
  kind: "monotone";
  bwFilter?: Choice;
  pictureTone?: Choice;
  gradation?: Gradation;
}

export interface ArtProfile {
  kind: "art";
  mode: PictureMode;
  filter?: Choice;
  effect?: Choice;
}

export interface UnknownProfile {
  kind: "unknown";
  mode: PictureMode;
}

/** The shot's picture mode with only the controls that mode lets you edit. */
export type Profile =
  | ColorProfile
  | MonochromeProfile
  | ColorCreatorProfile
  | StandardProfile
  | MonotoneProfile
  | ArtProfile
  | UnknownProfile;

export interface WhiteBalance {
  mode?: Choice;
  /**
   * Auto white balance's Keep Warm Color option, which the mode records: "Auto" has it on,
   * "Auto (Keep Warm Color Off)" has it off. Undefined for every other mode.
   */
  keepWarmColor?: boolean;
  /** Kelvin; undefined when the camera recorded 0 (auto). */
  temperature?: number;
  /** The white balance compensation, in steps along the camera's two axes. */
  fineTune?: WhiteBalanceFineTune;
}

export interface WhiteBalanceFineTune {
  /** Positive toward amber (A), negative toward blue (B). */
  amber: Ranged;
  /** Positive toward green (G), negative toward magenta (M). */
  green: Ranged;
}

export interface Processing {
  colorSpace?: Choice;
  noiseFilter?: LabeledRange;
  /** Active noise-reduction flags, e.g. ["Auto"]; empty when none. */
  noiseReduction?: string[];
  gradation?: Gradation;
  distortionCorrection?: boolean;
  shadingCompensation?: boolean;
  /** Second copies of saturation/contrast/sharpness on a -5..+5 scale (0x0503/05/06). */
  customSaturation?: Ranged;
  contrastSetting?: Ranged;
  sharpnessSetting?: Ranged;
}

export interface Exposure {
  /** Seconds. */
  exposureTime?: number;
  fNumber?: number;
  iso?: number;
  /** Millimetres. */
  focalLength?: number;
  /** EV. */
  exposureCompensation?: number;
  dateTimeOriginal?: string;
  offsetTimeOriginal?: string;
}

export interface Camera {
  make?: string;
  model?: string;
  /** Firmware string from EXIF Software, e.g. "Version 1.0". */
  firmware?: string;
  /** OM internal model code (Equipment 0x0100), e.g. "S0131". */
  cameraType?: string;
}

export interface Lens {
  model?: string;
}

/** One CameraSettings maker-note entry, for the "all values" table. */
export interface RawSetting {
  tag: number;
  /** e.g. "0x0539". */
  id: string;
  name?: string;
  type: string;
  count: number;
  /** Values as text, space-separated. */
  display: string;
}

export interface Recipe {
  profile: Profile;
  /** Highlight & Shadow control; applies on top of every mode except Art. */
  tone: ToneLevels;
  whiteBalance: WhiteBalance;
  processing: Processing;
  exposure: Exposure;
  camera: Camera;
  lens: Lens;
  raw: RawSetting[];
}
