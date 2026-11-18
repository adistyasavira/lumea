/**
 * LUMÉA — Colour space conversions: hex ↔ sRGB ↔ linear RGB ↔ XYZ (D65) ↔ CIELAB ↔ LCh.
 * Pure functions, no DOM access.
 */
import { ENGINE_CONFIG } from '../config/engine-config.js';

const { srgb, lab: LAB, whitePoint, numeric } = ENGINE_CONFIG;
const HEX_PATTERN = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;
const HEX_RADIX = 16;
const HEX_DIGITS = 2;

/**
 * Converts one gamma-encoded sRGB channel (0–255) to linear light (0–1).
 * @param {number} channel
 * @returns {number}
 */
export function srgbChannelToLinear(channel) {
  const normalised = channel / srgb.channelMax;
  if (normalised <= srgb.linearThreshold) return normalised / srgb.linearSlope;
  return ((normalised + srgb.gammaOffset) / srgb.gammaScale) ** srgb.gammaExponent;
}

/**
 * Converts one linear channel (0–1) back to an 8-bit sRGB channel.
 * @param {number} linear
 * @returns {number}
 */
export function linearChannelToSrgb(linear) {
  const clamped = Math.min(Math.max(linear, 0), 1);
  const encoded = clamped <= srgb.inverseLinearThreshold
    ? clamped * srgb.linearSlope
    : srgb.gammaScale * clamped ** (1 / srgb.gammaExponent) - srgb.gammaOffset;
  return Math.round(encoded * srgb.channelMax);
}

/** Lookup table: 8-bit sRGB channel → linear value. Avoids Math.pow per pixel. */
export const SRGB_TO_LINEAR_TABLE = Object.freeze(
  Array.from({ length: srgb.channelMax + 1 }, (_, channel) => srgbChannelToLinear(channel)),
);

/**
 * Multiplies a 3×3 matrix by a 3-vector.
 * @param {ReadonlyArray<ReadonlyArray<number>>} matrix
 * @param {[number, number, number]} vector
 * @returns {[number, number, number]}
 */
function multiplyMatrix(matrix, vector) {
  return matrix.map((row) => row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2]);
}

/** CIE f(t) used by the XYZ → Lab transform. */
function labCompand(ratio) {
  return ratio > LAB.epsilon
    ? ratio ** LAB.cubeRootExponent
    : (LAB.kappa * ratio + LAB.lightnessOffset) / LAB.lightnessScale;
}

/** Inverse of labCompand. */
function labExpand(value) {
  const cubed = value ** 3;
  return cubed > LAB.epsilon ? cubed : (LAB.lightnessScale * value - LAB.lightnessOffset) / LAB.kappa;
}

/**
 * Converts linear RGB (0–1 each) to CIELAB.
 * @param {{r:number,g:number,b:number}} linear
 * @returns {{l:number,a:number,b:number}}
 */
export function linearRgbToLab(linear) {
  const [x, y, z] = multiplyMatrix(ENGINE_CONFIG.rgbToXyz, [linear.r, linear.g, linear.b]);
  const fx = labCompand(x / whitePoint.x);
  const fy = labCompand(y / whitePoint.y);
  const fz = labCompand(z / whitePoint.z);
  return {
    l: LAB.lightnessScale * fy - LAB.lightnessOffset,
    a: LAB.aScale * (fx - fy),
    b: LAB.bScale * (fy - fz),
  };
}

/**
 * Converts CIELAB to linear RGB (unclamped).
 * @param {{l:number,a:number,b:number}} lab
 * @returns {{r:number,g:number,b:number}}
 */
export function labToLinearRgb(lab) {
  const fy = (lab.l + LAB.lightnessOffset) / LAB.lightnessScale;
  const fx = fy + lab.a / LAB.aScale;
  const fz = fy - lab.b / LAB.bScale;
  const xyz = [labExpand(fx) * whitePoint.x, labExpand(fy) * whitePoint.y, labExpand(fz) * whitePoint.z];
  const [r, g, b] = multiplyMatrix(ENGINE_CONFIG.xyzToRgb, xyz);
  return { r, g, b };
}

/**
 * Converts 8-bit sRGB to CIELAB.
 * @param {{r:number,g:number,b:number}} rgb
 * @returns {{l:number,a:number,b:number}}
 */
export function rgbToLab(rgb) {
  return linearRgbToLab({
    r: SRGB_TO_LINEAR_TABLE[rgb.r],
    g: SRGB_TO_LINEAR_TABLE[rgb.g],
    b: SRGB_TO_LINEAR_TABLE[rgb.b],
  });
}

/**
 * Converts CIELAB to cylindrical LCh (hue in degrees, 0–360).
 * @param {{l:number,a:number,b:number}} lab
 * @returns {{l:number,c:number,h:number}}
 */
export function labToLch(lab) {
  const hueRadians = Math.atan2(lab.b, lab.a);
  const hueDegrees = (hueRadians * numeric.degreesPerHalfTurn) / Math.PI;
  return {
    l: lab.l,
    c: Math.hypot(lab.a, lab.b),
    h: (hueDegrees + numeric.fullTurnDegrees) % numeric.fullTurnDegrees,
  };
}

/**
 * Parses "#RRGGBB" into 8-bit sRGB. Returns null for invalid input.
 * @param {string} hex
 * @returns {{r:number,g:number,b:number}|null}
 */
export function hexToRgb(hex) {
  const match = HEX_PATTERN.exec(String(hex).trim());
  if (!match) return null;
  return {
    r: parseInt(match[1], HEX_RADIX),
    g: parseInt(match[2], HEX_RADIX),
    b: parseInt(match[3], HEX_RADIX),
  };
}

/**
 * Formats 8-bit sRGB as "#RRGGBB".
 * @param {{r:number,g:number,b:number}} rgb
 * @returns {string}
 */
export function rgbToHex(rgb) {
  const toPair = (channel) => channel.toString(HEX_RADIX).padStart(HEX_DIGITS, '0');
  return `#${toPair(rgb.r)}${toPair(rgb.g)}${toPair(rgb.b)}`.toUpperCase();
}

/**
 * Converts CIELAB to a display hex (gamut-clamped).
 * @param {{l:number,a:number,b:number}} lab
 * @returns {string}
 */
export function labToHex(lab) {
  const linear = labToLinearRgb(lab);
  return rgbToHex({
    r: linearChannelToSrgb(linear.r),
    g: linearChannelToSrgb(linear.g),
    b: linearChannelToSrgb(linear.b),
  });
}

/**
 * Converts a hex colour straight to CIELAB. Returns null for invalid input.
 * @param {string} hex
 * @returns {{l:number,a:number,b:number}|null}
 */
export function hexToLab(hex) {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToLab(rgb) : null;
}
