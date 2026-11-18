/**
 * LUMÉA — Engine configuration.
 *
 * Every number the color engine uses lives here, documented, so the booth can be
 * recalibrated without touching logic. Values marked "calibrate" are starting
 * points that must be tuned with 10–20 volunteers under the booth ring light.
 */

/** sRGB transfer function constants (IEC 61966-2-1). */
const SRGB_TRANSFER = Object.freeze({
  channelMax: 255,
  linearThreshold: 0.04045,
  linearSlope: 12.92,
  gammaOffset: 0.055,
  gammaScale: 1.055,
  gammaExponent: 2.4,
  inverseLinearThreshold: 0.0031308,
});

/** Linear sRGB → CIE XYZ matrix for the D65 white point. */
const RGB_TO_XYZ_MATRIX = Object.freeze([
  [0.4124564, 0.3575761, 0.1804375],
  [0.2126729, 0.7151522, 0.072175],
  [0.0193339, 0.119192, 0.9503041],
]);

/** CIE XYZ → linear sRGB matrix (inverse of the matrix above). */
const XYZ_TO_RGB_MATRIX = Object.freeze([
  [3.2404542, -1.5371385, -0.4985314],
  [-0.969266, 1.8760108, 0.041556],
  [0.0556434, -0.2040259, 1.0572252],
]);

/** CIE D65 reference white (Y normalised to 1). Daylight ring lights sit close to it. */
const D65_WHITE = Object.freeze({ x: 0.95047, y: 1, z: 1.08883 });

/** CIE L*a*b* constants (CIE 15:2004). */
const LAB_CONSTANTS = Object.freeze({
  epsilon: 216 / 24389,
  kappa: 24389 / 27,
  lightnessScale: 116,
  lightnessOffset: 16,
  aScale: 500,
  bScale: 200,
  cubeRootExponent: 1 / 3,
});

/** Trimmed mean: drop the brightest 15% (ring-light glare, oil) and darkest 15% (pores, nose shadow). */
const TRIMMING = Object.freeze({ lowerRatio: 0.15, upperRatio: 0.15 });

/** A pixel counts as skin only inside these CIELAB bounds (calibrate). */
const SKIN_MASK = Object.freeze({
  hueMinDegrees: 15,
  hueMaxDegrees: 85,
  chromaMin: 6,
  chromaMax: 45,
  lightnessMin: 20,
  lightnessMax: 95,
});

/** Minimum usable pixels per zone before the zone is trusted. */
const SAMPLE_MINIMUMS = Object.freeze({ skinPixelsPerZone: 40, darkPixelsPerZone: 12 });

/** Eyebrow and hair sampling (contrast source). */
const DARK_FEATURE = Object.freeze({
  /** Share of darkest pixels kept inside the eyebrow box (the box also holds skin). */
  darkestRatio: 0.3,
  /** Hair zone is used only when it is at least this many L* points darker than skin (hijab, hats). */
  minimumGapToSkin: 10,
});

/** How much each skin zone contributes to the final skin colour. */
const SKIN_ZONE_WEIGHTS = Object.freeze({
  standard: Object.freeze({ forehead: 0.4, cheekLeft: 0.3, cheekRight: 0.3 }),
  /** With foundation/blush, cheeks are less trustworthy than the forehead. */
  withMakeup: Object.freeze({ forehead: 0.6, cheekLeft: 0.2, cheekRight: 0.2 }),
});

/**
 * Raw feature ranges mapped onto the −1…+1 axes used by the classifier (calibrate).
 * lightness → ITA° (Individual Typology Angle), undertone → hue angle h_ab,
 * chroma → C*ab, contrast → ΔL* between skin and eyebrow/hair.
 */
const FEATURE_SCALES = Object.freeze({
  lightness: Object.freeze({ min: 5, max: 55 }),
  undertone: Object.freeze({ min: 48, max: 66 }),
  chroma: Object.freeze({ min: 14, max: 30 }),
  contrast: Object.freeze({ min: 15, max: 55 }),
});

/** Human-readable label bands per axis (Stage 2 threshold table). */
const FEATURE_LABELS = Object.freeze({
  lightness: Object.freeze({ highFrom: 41, lowBelow: 19, high: 'Light', mid: 'Medium', low: 'Deep' }),
  undertone: Object.freeze({ highFrom: 60, lowBelow: 52, high: 'Warm', mid: 'Neutral', low: 'Cool' }),
  chroma: Object.freeze({ highFrom: 26, lowBelow: 19, high: 'Clear', mid: 'Medium', low: 'Soft' }),
  contrast: Object.freeze({ highFrom: 40, lowBelow: 25, high: 'High', mid: 'Medium', low: 'Low' }),
});

/** Weight of each axis in the season distance. Must sum to 1. */
const AXIS_WEIGHTS = Object.freeze({ undertone: 0.35, lightness: 0.25, chroma: 0.2, contrast: 0.2 });

/** Confidence scoring. */
const CONFIDENCE = Object.freeze({
  /** Relative distance gap between the two closest seasons below which the result is "between X and Y". */
  ambiguousMargin: 0.15,
  maximumPercent: 99,
  minimumPercent: 35,
  /** Multipliers applied when the capture was not ideal. */
  forcedCapturePenalty: 0.85,
  makeupPenalty: 0.9,
});

/** ITA° = arctan((L* − midpoint) / b*), Chardon et al. 1991. */
const ITA = Object.freeze({ lightnessMidpoint: 50 });

/** Numerical guards. */
const NUMERIC = Object.freeze({ epsilon: 1e-6, degreesPerHalfTurn: 180, fullTurnDegrees: 360, percent: 100 });

export const ENGINE_CONFIG = Object.freeze({
  srgb: SRGB_TRANSFER,
  rgbToXyz: RGB_TO_XYZ_MATRIX,
  xyzToRgb: XYZ_TO_RGB_MATRIX,
  whitePoint: D65_WHITE,
  lab: LAB_CONSTANTS,
  trimming: TRIMMING,
  skinMask: SKIN_MASK,
  sampleMinimums: SAMPLE_MINIMUMS,
  darkFeature: DARK_FEATURE,
  skinZoneWeights: SKIN_ZONE_WEIGHTS,
  featureScales: FEATURE_SCALES,
  featureLabels: FEATURE_LABELS,
  axisWeights: AXIS_WEIGHTS,
  confidence: CONFIDENCE,
  ita: ITA,
  numeric: NUMERIC,
});
