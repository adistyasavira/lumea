/**
 * LUMÉA — Turns zone samples into the four measured features:
 * lightness (ITA°), undertone (hue angle h_ab), chroma (C*ab) and contrast (ΔL*).
 */
import { ENGINE_CONFIG } from '../config/engine-config.js';
import { labToLch } from '../color/color-convert.js';
import { trimmedMeanLab, takeDarkest, meanLab, weightedMeanLab } from '../color/color-stats.js';

const { trimming, sampleMinimums, darkFeature, numeric } = ENGINE_CONFIG;

/** Error raised when a photo cannot be analysed; `code` drives the operator message. */
export class AnalysisError extends Error {
  /**
   * @param {'no-skin'|'no-dark-feature'} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'AnalysisError';
    this.code = code;
  }
}

/**
 * Trimmed-mean skin colour of one zone, or null when too few skin pixels were found.
 * @param {{skin:Array}} zone
 * @returns {{l:number,a:number,b:number}|null}
 */
export function measureZoneSkin(zone) {
  if (!zone || zone.skin.length < sampleMinimums.skinPixelsPerZone) return null;
  return trimmedMeanLab(zone.skin, trimming);
}

/**
 * Weighted skin colour across forehead and both cheeks.
 * @param {Record<string,{skin:Array}>} zones
 * @param {boolean} hasMakeup
 * @returns {{l:number,a:number,b:number}}
 * @throws {AnalysisError}
 */
export function measureSkin(zones, hasMakeup) {
  const weights = hasMakeup ? ENGINE_CONFIG.skinZoneWeights.withMakeup : ENGINE_CONFIG.skinZoneWeights.standard;
  const entries = Object.entries(weights).map(([zoneId, weight]) => ({ lab: measureZoneSkin(zones[zoneId]), weight }));
  const skinLab = weightedMeanLab(entries);
  if (!skinLab) {
    throw new AnalysisError('no-skin', 'Kulit tidak terbaca di dahi dan pipi. Pastikan wajah berada di dalam oval.');
  }
  return skinLab;
}

/**
 * Colour of the eyebrows: the darkest share of pixels inside both brow boxes.
 * @param {Record<string,{kind:string, all:Array}>} zones
 * @returns {{l:number,a:number,b:number}|null}
 */
export function measureBrows(zones) {
  const pixels = Object.values(zones).filter((zone) => zone.kind === 'brow').flatMap((zone) => zone.all);
  if (pixels.length < sampleMinimums.darkPixelsPerZone) return null;
  return meanLab(takeDarkest(pixels, darkFeature.darkestRatio));
}

/**
 * Hair colour, only when clearly darker than skin (otherwise a hijab, hat or backdrop is in view).
 * @param {Record<string,{kind:string, all:Array}>} zones
 * @param {{l:number}} skinLab
 * @returns {{l:number,a:number,b:number}|null}
 */
export function measureHair(zones, skinLab) {
  const hairZone = Object.values(zones).find((zone) => zone.kind === 'hair');
  if (!hairZone || hairZone.all.length < sampleMinimums.darkPixelsPerZone) return null;
  const hairLab = trimmedMeanLab(hairZone.all, trimming);
  return hairLab.l <= skinLab.l - darkFeature.minimumGapToSkin ? hairLab : null;
}

/**
 * The darkest facial feature available (eyebrows or hair), used for contrast.
 * @param {Record<string,{kind:string, all:Array}>} zones
 * @param {{l:number}} skinLab
 * @returns {{l:number,a:number,b:number}}
 * @throws {AnalysisError}
 */
export function measureDarkFeature(zones, skinLab) {
  const candidates = [measureBrows(zones), measureHair(zones, skinLab)].filter(Boolean);
  if (candidates.length === 0) {
    throw new AnalysisError('no-dark-feature', 'Alis tidak terbaca. Geser titik alis ke posisi alis customer.');
  }
  return candidates.reduce((darkest, lab) => (lab.l < darkest.l ? lab : darkest));
}

/**
 * Individual Typology Angle in degrees: arctan((L* − 50) / b*).
 * @param {{l:number,b:number}} lab
 * @returns {number}
 */
export function computeIta(lab) {
  const safeB = Math.max(lab.b, numeric.epsilon);
  return (Math.atan((lab.l - ENGINE_CONFIG.ita.lightnessMidpoint) / safeB) * numeric.degreesPerHalfTurn) / Math.PI;
}

/**
 * The four raw features.
 * @param {{l:number,a:number,b:number}} skinLab
 * @param {{l:number}} darkLab
 * @returns {{lightness:number, undertone:number, chroma:number, contrast:number}}
 */
export function computeFeatures(skinLab, darkLab) {
  const { c, h } = labToLch(skinLab);
  return { lightness: computeIta(skinLab), undertone: h, chroma: c, contrast: skinLab.l - darkLab.l };
}

/**
 * Text label for one axis value using the configured bands.
 * @param {number} value
 * @param {{highFrom:number, lowBelow:number, high:string, mid:string, low:string}} band
 * @returns {string}
 */
function labelFor(value, band) {
  if (value >= band.highFrom) return band.high;
  if (value < band.lowBelow) return band.low;
  return band.mid;
}

/**
 * Human-readable labels for all four features.
 * @param {{lightness:number, undertone:number, chroma:number, contrast:number}} features
 * @returns {{lightness:string, undertone:string, chroma:string, contrast:string}}
 */
export function describeFeatures(features) {
  const bands = ENGINE_CONFIG.featureLabels;
  return Object.fromEntries(Object.entries(features).map(([axis, value]) => [axis, labelFor(value, bands[axis])]));
}

/**
 * Live preview colours for the operator panel: skin, eyebrows and hair, each null when
 * the zone holds too few usable pixels. Never throws, so it is safe in the live loop.
 * @param {Record<string,{kind:string, skin:Array, all:Array}>} zones
 * @returns {{skin:object|null, brow:object|null, hair:object|null}}
 */
export function previewFeatureColors(zones) {
  const weights = ENGINE_CONFIG.skinZoneWeights.standard;
  const skin = weightedMeanLab(Object.entries(weights).map(([zoneId, weight]) => ({ lab: measureZoneSkin(zones[zoneId]), weight })));
  const hairZone = Object.values(zones).find((zone) => zone.kind === 'hair');
  const hasHair = Boolean(hairZone) && hairZone.all.length >= sampleMinimums.darkPixelsPerZone;
  return { skin, brow: measureBrows(zones), hair: hasHair ? trimmedMeanLab(hairZone.all, trimming) : null };
}
