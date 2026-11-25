/**
 * OM System / Olympus CameraSettings tag IDs and value labels.
 * Names and labels follow ExifTool (Image::ExifTool::Olympus, v13.50) so output can be
 * cross-checked against it; presentation-friendly wording belongs in the UI layer.
 */

export const CameraSettingsTag = {
  WhiteBalance2: 0x0500,
  WhiteBalanceTemperature: 0x0501,
  WhiteBalanceBracket: 0x0502,
  CustomSaturation: 0x0503,
  ModifiedSaturation: 0x0504,
  ContrastSetting: 0x0505,
  SharpnessSetting: 0x0506,
  ColorSpace: 0x0507,
  SceneMode: 0x0509,
  NoiseReduction: 0x050a,
  DistortionCorrection: 0x050b,
  ShadingCompensation: 0x050c,
  CompressionFactor: 0x050d,
  Gradation: 0x050f,
  PictureMode: 0x0520,
  PictureModeSaturation: 0x0521,
  PictureModeHue: 0x0522,
  PictureModeContrast: 0x0523,
  PictureModeSharpness: 0x0524,
  PictureModeBWFilter: 0x0525,
  PictureModeTone: 0x0526,
  NoiseFilter: 0x0527,
  ArtFilter: 0x0529,
  MagicFilter: 0x052c,
  PictureModeEffect: 0x052d,
  ToneLevel: 0x052e,
  ArtFilterEffect: 0x052f,
  ColorCreatorEffect: 0x0532,
  MonochromeProfileSettings: 0x0537,
  FilmGrainEffect: 0x0538,
  ColorProfileSettings: 0x0539,
  MonochromeVignetting: 0x053a,
  MonochromeColor: 0x053b,
} as const;

/** Names for the raw maker-note table. Tags not listed are shown by ID only. */
export const CAMERA_SETTINGS_TAG_NAMES: Record<number, string> = {
  0x0000: "CameraSettingsVersion",
  0x0100: "PreviewImageValid",
  0x0101: "PreviewImageStart",
  0x0102: "PreviewImageLength",
  0x0200: "ExposureMode",
  0x0201: "AELock",
  0x0202: "MeteringMode",
  0x0203: "ExposureShift",
  0x0300: "MacroMode",
  0x0301: "FocusMode",
  0x0302: "FocusProcess",
  0x0303: "AFSearch",
  0x0304: "AFAreas",
  0x0305: "AFPointSelected",
  0x0306: "AFFineTune",
  0x0307: "AFFineTuneAdj",
  0x0308: "FocusBracketStepSize",
  0x0309: "AISubjectTrackingMode",
  0x030a: "AFTargetInfo",
  0x030b: "SubjectDetectInfo",
  0x0400: "FlashMode",
  0x0401: "FlashExposureComp",
  0x0403: "FlashRemoteControl",
  0x0404: "FlashControlMode",
  0x0405: "FlashIntensity",
  0x0406: "ManualFlashStrength",
  ...Object.fromEntries(Object.entries(CameraSettingsTag).map(([name, id]) => [id, name])),
  0x0600: "DriveMode",
  0x0601: "PanoramaMode",
  0x0603: "ImageQuality2",
  0x0604: "ImageStabilization",
  0x0804: "StackedImage",
  0x0821: "ISOAutoSettings",
  0x0900: "ManometerPressure",
  0x0901: "ManometerReading",
  0x0902: "ExtendedWBDetect",
  0x0903: "RollAngle",
  0x0904: "PitchAngle",
  0x0908: "DateTimeUTC",
};

export const PICTURE_MODES: Record<number, string> = {
  1: "Vivid",
  2: "Natural",
  3: "Muted",
  4: "Portrait",
  5: "i-Enhance",
  6: "e-Portrait",
  7: "Color Creator",
  8: "Underwater",
  9: "Color Profile 1",
  10: "Color Profile 2",
  11: "Color Profile 3",
  12: "Monochrome Profile 1",
  13: "Monochrome Profile 2",
  14: "Monochrome Profile 3",
  17: "Art Mode",
  18: "Monochrome Profile 4",
  256: "Monotone",
  512: "Sepia",
};

/** The 12 Color Profile Control hues, in the order the camera stores them (0x0539 values 2-13). */
export const COLOR_PROFILE_HUES = [
  "Yellow",
  "Orange",
  "Orange-red",
  "Red",
  "Magenta",
  "Violet",
  "Blue",
  "Blue-cyan",
  "Cyan",
  "Green-cyan",
  "Green",
  "Yellow-green",
] as const;

export type ColorProfileHue = (typeof COLOR_PROFILE_HUES)[number];

/** Monochrome Profile color filter (0x0537 value 0). */
export const MONOCHROME_FILTERS: Record<number, string> = {
  0: "No Filter",
  1: "Yellow Filter",
  2: "Orange Filter",
  3: "Red Filter",
  4: "Magenta Filter",
  5: "Blue Filter",
  6: "Cyan Filter",
  7: "Green Filter",
  8: "Yellow-green Filter",
};

export const FILM_GRAIN: Record<number, string> = {
  0: "Off",
  1: "Low",
  2: "Medium",
  3: "High",
};

/** Monochrome Profile toning (0x053b). */
export const MONOCHROME_COLORS: Record<number, string> = {
  0: "(none)",
  1: "Normal",
  2: "Sepia",
  3: "Blue",
  4: "Purple",
  5: "Green",
};

/** Monotone picture mode B&W filter (0x0525). */
export const BW_FILTERS: Record<number, string> = {
  0: "n/a",
  1: "Neutral",
  2: "Yellow",
  3: "Orange",
  4: "Red",
  5: "Green",
};

/** Monotone picture mode toning (0x0526). */
export const PICTURE_TONES: Record<number, string> = {
  0: "n/a",
  1: "Neutral",
  2: "Sepia",
  3: "Blue",
  4: "Purple",
  5: "Green",
};

export const WHITE_BALANCE_MODES: Record<number, string> = {
  0: "Auto",
  1: "Auto (Keep Warm Color Off)",
  16: "7500K (Fine Weather with Shade)",
  17: "6000K (Cloudy)",
  18: "5300K (Fine Weather)",
  20: "3000K (Tungsten light)",
  21: "3600K (Tungsten light-like)",
  22: "Auto Setup",
  23: "5500K (Flash)",
  33: "6600K (Daylight fluorescent)",
  34: "4500K (Neutral white fluorescent)",
  35: "4000K (Cool white fluorescent)",
  36: "White Fluorescent",
  48: "3600K (Tungsten light-like)",
  67: "Underwater",
  256: "One Touch WB 1",
  257: "One Touch WB 2",
  258: "One Touch WB 3",
  259: "One Touch WB 4",
  512: "Custom WB 1",
  513: "Custom WB 2",
  514: "Custom WB 3",
  515: "Custom WB 4",
};

export const COLOR_SPACES: Record<number, string> = {
  0: "sRGB",
  1: "Adobe RGB",
  2: "Pro Photo RGB",
};

/** Bit flags of NoiseReduction (0x050a). */
export const NOISE_REDUCTION_BITS: Record<number, string> = {
  0: "Noise Reduction",
  1: "Noise Filter",
  2: "Noise Filter (ISO Boost)",
  3: "Auto",
};

/** Keyed by the full "value min max" triple, as ExifTool does. */
export const NOISE_FILTERS: Record<string, string> = {
  "0 0 0": "n/a",
  "-2 -2 1": "Off",
  "-1 -2 1": "Low",
  "0 -2 1": "Standard",
  "1 -2 1": "High",
};

/** i-Enhance effect (0x052d), keyed by "value min max". */
export const PICTURE_MODE_EFFECTS: Record<string, string> = {
  "0 0 0": "n/a",
  "-1 -1 1": "Low",
  "0 -1 1": "Standard",
  "1 -1 1": "High",
};

/** Gradation (0x050f) values 0-2, keyed by "value min max". */
export const GRADATIONS: Record<string, string> = {
  "-1 -1 1": "Low Key",
  "0 -1 1": "Normal",
  "0 0 0": "n/a",
  "1 -1 1": "High Key",
};

/** Gradation value 3. */
export const GRADATION_SELECTION: Record<number, string> = {
  0: "User-Selected",
  1: "Auto-Override",
};

export const ART_FILTERS: Record<number, string> = {
  0: "Off",
  1: "Soft Focus",
  2: "Pop Art",
  3: "Pale & Light Color",
  4: "Light Tone",
  5: "Pin Hole",
  6: "Grainy Film",
  8: "Underwater",
  9: "Diorama",
  10: "Cross Process",
  12: "Fish Eye",
  13: "Drawing",
  14: "Gentle Sepia",
  15: "Pale & Light Color II",
  16: "Pop Art II",
  17: "Pin Hole II",
  18: "Pin Hole III",
  19: "Grainy Film II",
  20: "Dramatic Tone",
  21: "Punk",
  22: "Soft Focus 2",
  23: "Sparkle",
  24: "Watercolor",
  25: "Key Line",
  26: "Key Line II",
  27: "Miniature",
  28: "Reflection",
  29: "Fragmented",
  31: "Cross Process II",
  32: "Dramatic Tone II",
  33: "Watercolor I",
  34: "Watercolor II",
  35: "Diorama II",
  36: "Vintage",
  37: "Vintage II",
  38: "Vintage III",
  39: "Partial Color",
  40: "Partial Color II",
  41: "Partial Color III",
  42: "Bleach Bypass",
  43: "Bleach Bypass II",
  44: "Instant Film",
};

/** Art filter effect (0x052f value 4). */
export const ART_FILTER_EFFECTS: Record<number, string> = {
  0x0000: "No Effect",
  0x8010: "Star Light",
  0x8020: "Pin Hole",
  0x8030: "Frame",
  0x8040: "Soft Focus",
  0x8050: "White Edge",
  0x8060: "B&W",
  0x8080: "Blur Top and Bottom",
  0x8081: "Blur Left and Right",
};

/** ToneLevel (0x052e) group type markers. */
export const TONE_LEVEL_TYPES: Record<number, "highlights" | "shadows" | "midtones"> = {
  [-31999]: "highlights",
  [-31998]: "shadows",
  [-31997]: "midtones",
};
