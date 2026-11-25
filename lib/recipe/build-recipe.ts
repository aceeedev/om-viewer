import { entryText, type Ifd, type IfdEntry, type PhotoMetadata } from "../exif";
import {
  ART_FILTER_EFFECTS,
  ART_FILTERS,
  BW_FILTERS,
  CAMERA_SETTINGS_TAG_NAMES,
  CameraSettingsTag as Tag,
  COLOR_PROFILE_HUES,
  COLOR_SPACES,
  FILM_GRAIN,
  GRADATION_SELECTION,
  GRADATIONS,
  MONOCHROME_COLORS,
  MONOCHROME_FILTERS,
  NOISE_FILTERS,
  NOISE_REDUCTION_BITS,
  PICTURE_MODE_EFFECTS,
  PICTURE_MODES,
  PICTURE_TONES,
  TONE_LEVEL_TYPES,
  WHITE_BALANCE_MODES,
} from "./tags";
import type {
  Choice,
  Gradation,
  LabeledRange,
  PictureMode,
  Processing,
  Profile,
  Ranged,
  RawSetting,
  Recipe,
  ToneLevels,
  WhiteBalance,
  WhiteBalanceFineTune,
} from "./types";

const EQUIPMENT_CAMERA_TYPE = 0x0100;
const EQUIPMENT_LENS_MODEL = 0x0203;

const SHADING_RANGE = { min: -5, max: 5 };

/** White balance compensation goes up to 7 steps each way on both axes (OM System specs). */
const WB_FINE_TUNE_RANGE = { min: -7, max: 7 };

/** WhiteBalance2 IDs of Auto with Keep Warm Color on and off. */
const WB_AUTO = 0;
const WB_AUTO_KEEP_WARM_OFF = 1;

export const UNVERIFIED = {
  colorProfileShading:
    "Assumed to be stored in the same tag as Monochrome Profile shading (0x053a); " +
    "not yet confirmed on a Color Profile shot with shading set.",
} as const;

/** Turn parsed maker notes into labeled settings. Missing tags become undefined fields. */
export function buildRecipe(metadata: PhotoMetadata): Recipe {
  const cs: Ifd = metadata.makerNote.cameraSettings ?? new Map();
  const equipment: Ifd = metadata.makerNote.equipment ?? new Map();
  const { exif } = metadata;
  const gradation = readGradation(cs);

  return {
    profile: readProfile(cs, gradation),
    tone: readTone(ints(cs, Tag.ToneLevel)),
    whiteBalance: readWhiteBalance(cs),
    processing: readProcessing(cs, gradation),
    exposure: {
      exposureTime: exif.exposureTime,
      fNumber: exif.fNumber,
      iso: exif.iso,
      focalLength: exif.focalLength,
      exposureCompensation: exif.exposureCompensation,
      dateTimeOriginal: exif.dateTimeOriginal,
      offsetTimeOriginal: exif.offsetTimeOriginal,
    },
    camera: {
      make: exif.make,
      model: exif.model,
      firmware: exif.software,
      cameraType: entryText(equipment.get(EQUIPMENT_CAMERA_TYPE))?.trim() || undefined,
    },
    lens: {
      model: exif.lensModel ?? (entryText(equipment.get(EQUIPMENT_LENS_MODEL))?.trim() || undefined),
    },
    raw: [...cs.values()].sort((a, b) => a.tag - b.tag).map(toRawSetting),
  };
}

// ---- picture mode / profile ----------------------------------------------

function readPictureMode(cs: Ifd): PictureMode {
  const id = ints(cs, Tag.PictureMode)?.[0];
  if (id === undefined) return { id: -1, label: "Unknown" };
  const mode: PictureMode = { id, label: PICTURE_MODES[id] ?? `Unknown (${id})` };
  const slot = pictureModeSlot(id);
  if (slot !== undefined) mode.slot = slot;
  return mode;
}

function pictureModeSlot(id: number): number | undefined {
  if (id >= 9 && id <= 11) return id - 8; // Color Profile 1-3
  if (id >= 12 && id <= 14) return id - 11; // Monochrome Profile 1-3
  if (id === 18) return 4; // Monochrome Profile 4
  return undefined;
}

function readProfile(cs: Ifd, gradation: Gradation | undefined): Profile {
  const mode = readPictureMode(cs);
  const contrast = rangedAt(ints(cs, Tag.PictureModeContrast));
  const sharpness = rangedAt(ints(cs, Tag.PictureModeSharpness));
  const id = mode.id;

  if (id >= 9 && id <= 11) {
    const cp = ints(cs, Tag.ColorProfileSettings);
    const shading = int(cs, Tag.MonochromeVignetting);
    return {
      kind: "colorProfile",
      mode,
      contrast,
      sharpness,
      hues:
        cp && cp.length >= 2 + COLOR_PROFILE_HUES.length
          ? COLOR_PROFILE_HUES.map((hue, i) => ({ hue, value: cp[2 + i], min: cp[0], max: cp[1] }))
          : [],
      shading:
        shading === undefined
          ? undefined
          : { value: shading, ...SHADING_RANGE, unverified: UNVERIFIED.colorProfileShading },
    };
  }

  if ((id >= 12 && id <= 14) || id === 18) {
    const mp = ints(cs, Tag.MonochromeProfileSettings);
    const shading = int(cs, Tag.MonochromeVignetting);
    return {
      kind: "monochromeProfile",
      mode,
      contrast,
      sharpness,
      filter: choice(mp?.[0], MONOCHROME_FILTERS),
      filterStrength: rangedAt(mp, 3),
      filmGrain: choice(int(cs, Tag.FilmGrainEffect), FILM_GRAIN),
      shading: shading === undefined ? undefined : { value: shading, ...SHADING_RANGE },
      toning: choice(int(cs, Tag.MonochromeColor), MONOCHROME_COLORS),
    };
  }

  if (id === 7) {
    const cc = ints(cs, Tag.ColorCreatorEffect);
    return {
      kind: "colorCreator",
      mode,
      contrast,
      sharpness,
      color: rangedAt(cc, 0),
      strength: rangedAt(cc, 3),
    };
  }

  if (id === 256 || id === 512) {
    return {
      kind: "monotone",
      mode,
      contrast,
      sharpness,
      bwFilter: choice(int(cs, Tag.PictureModeBWFilter), BW_FILTERS),
      pictureTone: choice(int(cs, Tag.PictureModeTone), PICTURE_TONES),
      gradation,
    };
  }

  if (id === 17) {
    return {
      kind: "art",
      mode,
      filter: choice(ints(cs, Tag.ArtFilter)?.[0], ART_FILTERS),
      effect: choice(ints(cs, Tag.ArtFilterEffect)?.[4], ART_FILTER_EFFECTS),
    };
  }

  if (id in PICTURE_MODES) {
    return {
      kind: "standard",
      mode,
      contrast,
      sharpness,
      saturation: rangedAt(ints(cs, Tag.PictureModeSaturation)),
      gradation,
      effect: id === 5 ? labeledRange(ints(cs, Tag.PictureModeEffect), PICTURE_MODE_EFFECTS) : undefined,
    };
  }

  return { kind: "unknown", mode };
}

// ---- shared sections -------------------------------------------------------

/** ToneLevel is groups of [type, value, min, max]; unused groups have type 0. */
function readTone(values: number[] | undefined): ToneLevels {
  const tone: ToneLevels = {};
  if (!values) return tone;
  for (let i = 0; i + 3 < values.length; i += 4) {
    const key = TONE_LEVEL_TYPES[values[i]];
    if (key) tone[key] = { value: values[i + 1], min: values[i + 2], max: values[i + 3] };
  }
  return tone;
}

function readGradation(cs: Ifd): Gradation | undefined {
  const values = ints(cs, Tag.Gradation);
  const base = labeledRange(values, GRADATIONS);
  if (!base || !values) return undefined;
  return values.length > 3
    ? { ...base, selection: GRADATION_SELECTION[values[3]] ?? `Unknown (${values[3]})` }
    : base;
}

function readWhiteBalance(cs: Ifd): WhiteBalance {
  const mode = int(cs, Tag.WhiteBalance2);
  const temperature = int(cs, Tag.WhiteBalanceTemperature);
  return {
    mode: choice(mode, WHITE_BALANCE_MODES),
    keepWarmColor: mode === WB_AUTO ? true : mode === WB_AUTO_KEEP_WARM_OFF ? false : undefined,
    temperature: temperature ? temperature : undefined,
    fineTune: readFineTune(ints(cs, Tag.WhiteBalanceFineTune)),
  };
}

/**
 * Tag 0x0502 holds two values on OM System bodies: [blue↔amber, magenta↔green]. This was
 * confirmed on the OM-3 by shooting one known shift per frame (exiftool/exiftool#462), and
 * ExifTool 13.60 reads it the same way. Older bodies write a single value of unknown meaning
 * (ExifTool's "WhiteBalanceBracket"), which is left to the raw table.
 */
function readFineTune(values: number[] | undefined): WhiteBalanceFineTune | undefined {
  if (values?.length !== 2) return undefined;
  return {
    amber: { value: values[0], ...WB_FINE_TUNE_RANGE },
    green: { value: values[1], ...WB_FINE_TUNE_RANGE },
  };
}

function readProcessing(cs: Ifd, gradation: Gradation | undefined): Processing {
  const noiseReduction = int(cs, Tag.NoiseReduction);
  const onOff = (tag: number) => {
    const v = int(cs, tag);
    return v === undefined ? undefined : v === 1;
  };
  return {
    colorSpace: choice(int(cs, Tag.ColorSpace), COLOR_SPACES),
    noiseFilter: labeledRange(ints(cs, Tag.NoiseFilter), NOISE_FILTERS),
    noiseReduction: noiseReduction === undefined ? undefined : bitLabels(noiseReduction, NOISE_REDUCTION_BITS),
    gradation,
    distortionCorrection: onOff(Tag.DistortionCorrection),
    shadingCompensation: onOff(Tag.ShadingCompensation),
    customSaturation: rangedAt(ints(cs, Tag.CustomSaturation)),
    contrastSetting: rangedAt(ints(cs, Tag.ContrastSetting)),
    sharpnessSetting: rangedAt(ints(cs, Tag.SharpnessSetting)),
  };
}

// ---- raw table ---------------------------------------------------------------

const TYPE_NAMES: Record<number, string> = {
  1: "int8u",
  2: "string",
  3: "int16u",
  4: "int32u",
  5: "rational64u",
  6: "int8s",
  7: "undef",
  8: "int16s",
  9: "int32s",
  10: "rational64s",
  11: "float",
  12: "double",
  13: "ifd",
};

const MAX_RAW_BYTES = 64;

function toRawSetting(entry: IfdEntry): RawSetting {
  return {
    tag: entry.tag,
    id: `0x${entry.tag.toString(16).padStart(4, "0")}`,
    name: CAMERA_SETTINGS_TAG_NAMES[entry.tag],
    type: TYPE_NAMES[entry.type] ?? `type ${entry.type}`,
    count: entry.count,
    display: displayValue(entry),
  };
}

function displayValue(entry: IfdEntry): string {
  const v = entry.value;
  switch (v.kind) {
    case "int":
    case "float":
      return v.values.join(" ");
    case "rational":
      return v.values
        .map(({ num, den }) => (den === 0 ? (num === 0 ? "undef" : "inf") : String(num / den)))
        .join(" ");
    case "ascii":
      return v.text.trim();
    case "bytes": {
      const printable = v.bytes.every((b) => b === 0 || (b >= 0x20 && b < 0x7f));
      if (printable) return entryText(entry)?.trim() ?? "";
      const shown = [...v.bytes.subarray(0, MAX_RAW_BYTES)].map((b) => b.toString(16).padStart(2, "0"));
      return shown.join(" ") + (v.bytes.length > MAX_RAW_BYTES ? ` … (${v.bytes.length} bytes)` : "");
    }
  }
}

// ---- value helpers -------------------------------------------------------------

/** Integer values of a tag, or undefined if missing or not an integer type. */
function ints(cs: Ifd, tag: number): number[] | undefined {
  const entry = cs.get(tag);
  return entry?.value.kind === "int" ? entry.value.values : undefined;
}

function int(cs: Ifd, tag: number): number | undefined {
  return ints(cs, tag)?.[0];
}

function rangedAt(values: number[] | undefined, start = 0): Ranged | undefined {
  if (!values || values.length < start + 3) return undefined;
  return { value: values[start], min: values[start + 1], max: values[start + 2] };
}

function choice(id: number | undefined, labels: Record<number, string>): Choice | undefined {
  return id === undefined ? undefined : { id, label: labels[id] ?? `Unknown (${id})` };
}

function labeledRange(values: number[] | undefined, labels: Record<string, string>): LabeledRange | undefined {
  const ranged = rangedAt(values);
  if (!ranged || !values) return undefined;
  const key = values.slice(0, 3).join(" ");
  return { ...ranged, label: labels[key] ?? `Unknown (${key})` };
}

function bitLabels(value: number, labels: Record<number, string>): string[] {
  const out: string[] = [];
  for (let bit = 0; bit < 16; bit++) {
    if (value & (1 << bit)) out.push(labels[bit] ?? `Bit ${bit}`);
  }
  return out;
}
